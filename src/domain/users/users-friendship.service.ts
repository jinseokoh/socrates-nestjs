import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  PaginateConfig,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { LedgerType, FriendStatus } from 'src/common/enums';
import { AnyData } from 'src/common/types';
import { DataSource, Not } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CreateFriendshipDto } from 'src/domain/users/dto/create-friendship.dto';
import { Friendship } from 'src/domain/users/entities/friendship.entity';
import { Ledger } from 'src/domain/ledgers/entities/ledger.entity';
import { Repository } from 'typeorm/repository/Repository';
import { User } from 'src/domain/users/entities/user.entity';
import { Plea } from 'src/domain/pleas/entities/plea.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserNotificationEvent } from 'src/domain/users/events/user-notification.event';

@Injectable()
export class UsersFriendshipService {
  private readonly env: any;
  private readonly logger = new Logger(UsersFriendshipService.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    @InjectRepository(Friendship)
    private readonly friendshipRepository: Repository<Friendship>,
    @Inject(ConfigService) private configService: ConfigService, // global

    private dataSource: DataSource, // for transaction
    private eventEmitter: EventEmitter2,
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //?-------------------------------------------------------------------------//
  //? Friendship Pivot
  //?-------------------------------------------------------------------------//

  // -------------------------------------------------------------------------//
  // Create
  // -------------------------------------------------------------------------//

  //! 친구신청 생성 (using transaction)
  //! profile's balance will be adjusted w/ ledger model event subscriber.
  //! - for hated(blocked) users, app needs to take care of 'em instead of server.
  async createFriendship(dto: CreateFriendshipDto): Promise<User> {
    // create a new query runner
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // validation ----------------------------------------------------------//
      const friendship = await queryRunner.manager.findOne(Friendship, {
        where: [
          { userId: dto.userId, recipientId: dto.recipientId },
          { userId: dto.recipientId, recipientId: dto.userId },
        ],
      });
      if (friendship) {
        if (friendship.status === FriendStatus.ACCEPTED) {
          throw new UnprocessableEntityException(`relationship exists`);
        } else {
          // friendship 이미 존재
          throw new UnprocessableEntityException(`entity exists`);
        }
      }

      // validation ----------------------------------------------------------//
      const sender = await queryRunner.manager.findOneOrFail(User, {
        where: { id: dto.userId },
        relations: [`profile`],
      });
      if (sender?.isBanned) {
        throw new UnprocessableEntityException(`a banned user`);
      }
      if (
        (dto.cost > 0 && sender.profile?.balance === null) ||
        sender.profile?.balance - dto.cost < 0
      ) {
        throw new BadRequestException(`insufficient balance`);
      }

      // validation ----------------------------------------------------------//
      const recipient = await queryRunner.manager.findOneOrFail(User, {
        where: { id: dto.recipientId },
        relations: [`profile`],
      });

      if (dto.cost > 0) {
        const newBalance = sender.profile?.balance - dto.cost;
        sender.profile.balance = newBalance;
        const ledger = new Ledger({
          credit: dto.cost,
          ledgerType: LedgerType.CREDIT_SPEND,
          balance: newBalance,
          note: `친구 신청료 (대상#${dto.recipientId})`,
          userId: dto.userId,
        });
        await queryRunner.manager.save(ledger);
      }
      await queryRunner.manager.query(
        'INSERT IGNORE INTO `friendship` \
        (userId, recipientId, friendRequestType, message, pleaId) VALUES (?, ?, ?, ?, ?)',
        [
          dto.userId,
          dto.recipientId,
          dto.friendRequestType,
          dto.message,
          dto.pleaId,
        ],
      );
      await queryRunner.commitTransaction();

      // notification with event listener ------------------------------------//
      const event = new UserNotificationEvent();
      event.name = 'friendRequest';
      event.userId = recipient.id;
      event.token = recipient.pushToken;
      event.options = recipient.profile?.options ?? {};
      event.body = `${sender.username}님으로부터 친구신청을 받았습니다. ${dto.message}`;
      event.data = {
        page: 'activities/requests',
        args: 'tab:7',
      };
      this.eventEmitter.emit('user.notified', event);

      return sender;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error.name === 'EntityNotFoundError') {
        throw new NotFoundException(`user not found`);
      } else {
        throw error;
      }
    } finally {
      await queryRunner.release();
    }
  }

  // -------------------------------------------------------------------------//
  // Update
  // -------------------------------------------------------------------------//

  //! 친구신청 수락 (using transaction)
  //! profile balance will be adjusted w/ ledger model event subscriber.
  async updateFriendshipWithStatus(
    userId: number,
    recipientId: number,
    status: FriendStatus,
  ): Promise<void> {
    // create a new query runner
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // validation ----------------------------------------------------------//
      const friendship = await queryRunner.manager.findOneOrFail(Friendship, {
        where: {
          userId: userId,
          recipientId: recipientId,
        },
        relations: ['sender', 'sender.profile', 'recipient', 'plea'],
      });

      if (
        friendship.plea &&
        friendship.plea.feedId !== null &&
        status === FriendStatus.ACCEPTED
      ) {
        //? plea.reward 를 friendship sender (== plea recipient; 작성자) 에게 지급
        const newBalance =
          friendship.user.profile?.balance + friendship.plea.reward;
        const ledger = new Ledger({
          debit: friendship.plea.reward,
          ledgerType: LedgerType.DEBIT_REWARD,
          balance: newBalance,
          note: `요청 사례금 (발송#${friendship.recipientId},수신#${friendship.userId})`,
          userId: friendship.user.id,
        });
        await queryRunner.manager.save(ledger);
        // soft delete the plea
        // await this.repository.manager.query(
        //   'UPDATE `plea` SET deletedAt = NOW() WHERE id = ?',
        //   [friendship.plea.id],
        // );
        await queryRunner.manager
          .getRepository(Plea)
          .softDelete(friendship.plea.id);
      }

      await this.repository.manager.query(
        'UPDATE `friendship` SET status = ? WHERE userId = ? AND recipientId = ?',
        [status, userId, recipientId],
      );

      await queryRunner.commitTransaction();

      // notification with event listener ------------------------------------//
      if (
        friendship.status == FriendStatus.PENDING &&
        status == FriendStatus.ACCEPTED
      ) {
        const event = new UserNotificationEvent();
        event.name = 'friendRequestApproval';
        event.userId = friendship.user?.id;
        event.token = friendship.user?.pushToken;
        event.options = friendship.user?.profile?.options ?? {};
        event.body = friendship.plea
          ? `요청한 ${friendship.recipient.username}님이 친구관계를 맺었습니다. (${friendship.plea.reward}코인수령 완료)`
          : `${friendship.recipient.username}님이 신청을 수락하여 친구관계를 맺었습니다.`;
        event.data = {
          page: `settings/friends`,
          args: 'load:plea',
        };
        this.eventEmitter.emit('user.notified', event);
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // -------------------------------------------------------------------------//
  // Delete
  // -------------------------------------------------------------------------//

  //! 친구신청 삭제 (using transaction)
  //! profile balance will be adjusted w/ ledger model event subscriber.
  // 시나리오
  // case 1) 친구신청 보낸 사용자가 [보낸친구신청] 리스트에서 취소
  //         Ledger = 변화 없음
  // case 2) 요청받은 사용자가 답글작성 후 (자동으로 친구신청이 보내진 후) [보낸친구신청] 리스트에서 취소 -> client 에서 금지!
  //         Ledger = 요청보낸 사용자에게 reward-1 환불
  // case 3) 요청보낸 사용자가 [받은친구신청] 리스트에서 거절
  //         Ledger = 요청보낸 사용자에게 reward-1 환불
  // case 4) 요청받은 사용자가 reward 지급받은 이후, 24 시간 안에 친구해제 (to be implemented)
  //         Ledger = 요청받은 사용자에게 reward 차감 (무효처리)
  //         Ledger = 요청보낸 사용자에게 reward-1 환불
  //
  async deleteFriendship(userId: number, recipientId: number): Promise<void> {
    // create a new query runner
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // validation ----------------------------------------------------------//
      const friendship = await queryRunner.manager.findOneOrFail(Friendship, {
        where: {
          userId: userId,
          recipientId: recipientId,
        },
        relations: [
          'sender',
          'sender.profile',
          'recipient',
          'recipient.profile',
          'plea',
        ],
      });

      // 요청으로 보낸 친구신청인 경우
      if (friendship.plea && friendship.plea.feedId !== null) {
        const newBalance =
          friendship.recipient.profile?.balance + friendship.plea.reward - 1;

        const ledger = new Ledger({
          debit: friendship.plea.reward - 1,
          ledgerType: LedgerType.DEBIT_REFUND,
          balance: newBalance,
          note: `요청중지 사례금 환불 (발송#${friendship.recipientId},수신#${friendship.userId})`,
          userId: recipientId,
        });
        await queryRunner.manager.save(ledger);
        // soft delete the plea
        await queryRunner.manager
          .getRepository(Plea)
          .softDelete(friendship.plea.id);
      }

      await queryRunner.manager.query(
        'DELETE FROM `friendship` WHERE userId = ? AND recipientId = ?',
        [userId, recipientId],
      );

      await queryRunner.commitTransaction();

      //? notification with event listener ------------------------------------//
      const event = new UserNotificationEvent();
      event.name = 'friendRequestDenial';
      event.userId = userId;
      event.token = friendship.user.pushToken;
      event.options = friendship.user.profile?.options ?? {};
      event.body = friendship.plea
        ? `발견글 작성요청한 ${friendship.recipient.username}님이 나와의 친구관계를 유보했습니다.`
        : `${friendship.recipient.username}님이 나와의 친구관계를 유보했습니다.`;
      event.data = {
        page: `settings/friends`,
        args: 'load/plea',
      };
      this.eventEmitter.emit('user.notified', event);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  //--------------------------------------------------------------------------//

  // 받은 친구신청 리스트 (paginated)
  async getFriendshipsReceived(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Friendship>> {
    const queryBuilder = this.friendshipRepository
      .createQueryBuilder('friendship')
      .innerJoinAndSelect('friendship.user', 'sender')
      .innerJoinAndSelect('sender.profile', 'profile')
      .innerJoinAndSelect('friendship.recipient', 'recipient')
      .where({
        recipientId: userId,
        status: Not(FriendStatus.ACCEPTED),
      });

    const config: PaginateConfig<Friendship> = {
      sortableColumns: ['createdAt'],
      defaultLimit: 20,
      defaultSortBy: [['createdAt', 'DESC']],
      filterableColumns: {
        status: [FilterOperator.EQ],
      },
    };

    return await paginate(query, queryBuilder, config);
  }

  // 보낸 친구신청 리스트 (paginated)
  async getFriendshipsSent(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Friendship>> {
    const queryBuilder = this.friendshipRepository
      .createQueryBuilder('friendship')
      .innerJoinAndSelect('friendship.user', 'sender')
      .innerJoinAndSelect('friendship.recipient', 'recipient')
      .innerJoinAndSelect('recipient.profile', 'profile')
      .where({
        userId: userId,
        status: Not(FriendStatus.ACCEPTED),
      });

    const config: PaginateConfig<Friendship> = {
      sortableColumns: ['createdAt'],
      defaultLimit: 20,
      defaultSortBy: [['createdAt', 'DESC']],
      filterableColumns: {
        status: [FilterOperator.EQ],
      },
    };

    return await paginate(query, queryBuilder, config);
  }

  // 내친구 리스트를 위한, 받거나 보낸 친구신청 리스트 (paginated)
  async getMyFriendships(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Friendship>> {
    const queryBuilder = this.friendshipRepository
      .createQueryBuilder('friendship')
      .innerJoinAndSelect('friendship.user', 'sender')
      .innerJoinAndSelect('sender.profile', 'sprofile')
      .innerJoinAndSelect('friendship.recipient', 'recipient')
      .innerJoinAndSelect('recipient.profile', 'rprofile')
      .where([{ userId: userId }, { recipientId: userId }]);

    const config: PaginateConfig<Friendship> = {
      sortableColumns: ['createdAt'],
      defaultLimit: 20,
      defaultSortBy: [['createdAt', 'DESC']],
      filterableColumns: {
        status: [FilterOperator.EQ],
      },
    };

    return await paginate(query, queryBuilder, config);
  }

  //--------------------------------------------------------------------------//

  // 친구관계 ID 리스트 (all)
  async getFriendshipIds(userId: number): Promise<AnyData> {
    const rows = await this.repository.manager.query(
      'SELECT status, userId, recipientId \
      FROM `friendship` \
      WHERE userId = ? OR recipientId = ?',
      [userId, userId],
    );

    const pendingIds = rows
      .filter((v: any) => v.status !== 'accepted')
      .map((v: any) => {
        return v.userId === userId ? v.recipientId : v.userId;
      });

    const friendIds = rows
      .filter((v: any) => v.status === 'accepted')
      .map((v: any) => {
        return v.userId === userId ? v.recipientId : v.userId;
      });

    // todo. remove dups
    return {
      data: {
        pendingIds,
        friendIds,
      },
    };
  }
}
