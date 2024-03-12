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
import { LedgerType, FriendshipStatus, PleaStatus } from 'src/common/enums';
import { AnyData } from 'src/common/types';
import { DataSource, Not } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CreateFriendshipDto } from 'src/domain/users/dto/create-friendship.dto';
import { Friendship } from 'src/domain/users/entities/friendship.entity';
import { Ledger } from 'src/domain/ledgers/entities/ledger.entity';
import { Repository } from 'typeorm/repository/Repository';
import { User } from 'src/domain/users/entities/user.entity';
import { Plea } from 'src/domain/users/entities/plea.entity';
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

    private eventEmitter: EventEmitter2,
    private dataSource: DataSource, // for transaction
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
  //! profile balance will be adjusted w/ ledger model event subscriber.
  //! for hated(blocked) users, app needs to take care of 'em instead of server.
  async createFriendship(dto: CreateFriendshipDto): Promise<void> {
    // create a new query runner
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // validation ----------------------------------------------------------//
      const friendship = await queryRunner.manager.findOne(Friendship, {
        where: [
          { senderId: dto.senderId, recipientId: dto.recipientId },
          { senderId: dto.recipientId, recipientId: dto.senderId },
        ],
      });
      if (friendship) {
        if (friendship.status === FriendshipStatus.ACCEPTED) {
          throw new UnprocessableEntityException(`in a relationship`);
        } else {
          // friendship 이미 존재
          throw new UnprocessableEntityException(`entity exists`);
        }
      }

      // validation ----------------------------------------------------------//
      const sender = await queryRunner.manager.findOneOrFail(User, {
        where: { id: dto.senderId },
        relations: [`profile`],
      });
      if (sender?.isBanned) {
        throw new UnprocessableEntityException(`a banned user`);
      }
      if (
        sender.profile?.balance === null ||
        sender.profile?.balance - dto.cost < 0
      ) {
        throw new BadRequestException(`insufficient balance`);
      }

      // validation ----------------------------------------------------------//
      const recipient = await queryRunner.manager.findOneOrFail(User, {
        where: { id: dto.recipientId },
        relations: [`profile`],
      });

      // initialize
      const newBalance = sender.profile?.balance - dto.cost;
      if (dto.cost > 0) {
        const ledger = new Ledger({
          credit: dto.cost,
          ledgerType: LedgerType.CREDIT_SPEND,
          balance: newBalance,
          note: `친구.신청료 -${dto.cost} 🪙 (user: #${dto.senderId})`,
          userId: dto.senderId,
        });
        await queryRunner.manager.save(ledger);
      }
      await queryRunner.manager.query(
        'INSERT IGNORE INTO `friendship` \
        (senderId, recipientId, requestFrom, message, pleaId) VALUES (?, ?, ?, ?, ?)',
        [
          dto.senderId,
          dto.recipientId,
          dto.requestFrom,
          dto.message,
          dto.pleaId,
        ],
      );
      await queryRunner.commitTransaction();

      // notification with event listener ------------------------------------//
      const event = new UserNotificationEvent();
      event.name = 'friendRequest';
      event.token = recipient.pushToken;
      event.options = recipient.profile?.options ?? {};
      event.body = `${sender.username}님이 나에게 친구신청을 보냈습니다. ${dto.message}`;
      this.eventEmitter.emit('user.notified', event);
    } catch (error) {
      if (error.name === 'EntityNotFoundError') {
        throw new NotFoundException(`user not found`);
      } else {
        await queryRunner.rollbackTransaction();
      }
      throw error;
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
    senderId: number,
    recipientId: number,
    status: FriendshipStatus,
  ): Promise<void> {
    // create a new query runner
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // validation ----------------------------------------------------------//
      const friendship = await queryRunner.manager.findOneOrFail(Friendship, {
        where: {
          senderId: senderId,
          recipientId: recipientId,
        },
        relations: ['sender', 'sender.profile', 'recipient', 'plea'],
      });

      if (
        friendship.plea &&
        friendship.plea.status === PleaStatus.PENDING &&
        status === FriendshipStatus.ACCEPTED
      ) {
        // update plea.status to ACCEPTED
        await this.repository.manager.query(
          'UPDATE `plea` SET status = ? WHERE id = ?',
          [PleaStatus.ACCEPTED, friendship.plea.id],
        );
        // plea.reward 를 friendship sender (= plea recipient) 에게 지급
        const newBalance =
          friendship.sender.profile?.balance + friendship.plea.reward;
        const ledger = new Ledger({
          debit: friendship.plea.reward,
          ledgerType: LedgerType.DEBIT_REWARD,
          balance: newBalance,
          note: `요청.사례금 +${friendship.plea.reward} 🪙 (user: #${friendship.sender.id}, plea: #${friendship.plea.id})`,
          userId: friendship.sender.id,
        });
        await queryRunner.manager.save(ledger);
        // soft-delete plea
        await queryRunner.manager
          .getRepository(Plea)
          .softDelete(friendship.plea.id);
      }

      await this.repository.manager.query(
        'UPDATE `friendship` SET status = ? WHERE senderId = ? AND recipientId = ?',
        [status, senderId, recipientId],
      );

      await queryRunner.commitTransaction();

      // notification with event listener ------------------------------------//
      if (
        friendship.status == FriendshipStatus.PENDING &&
        status == FriendshipStatus.ACCEPTED
      ) {
        const event = new UserNotificationEvent();
        event.name = 'friendRequestApproval';
        event.token = friendship.sender?.pushToken;
        event.options = friendship.sender?.profile?.options ?? {};
        event.body = friendship.plea
          ? `답글을 요청한 ${friendship.recipient.username}님과 친구가 되어, ${friendship.plea.reward}코인을 받았습니다.`
          : `${friendship.recipient.username}님이 나의 친구신청을 수락했습니다.`;
        this.eventEmitter.emit('user.notified', event);
      }
    } catch (error) {
      if (error.name === 'EntityNotFoundError') {
        throw new NotFoundException('entity not found');
      } else {
        await queryRunner.rollbackTransaction();
      }
      throw new BadRequestException(error.name ?? error.toString());
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
  // case 2) 요청받은 사용자가 답글작성 후 (자동으로 친구신청이 보내진 후) [보낸친구신청] 리스트에서 취소
  //         Ledger = 요청보낸 사용자에게 reward-1 환불
  // case 3) 요청보낸 사용자가 [받은친구신청] 리스트에서 거절
  //         Ledger = 요청보낸 사용자에게 reward-1 환불
  // case 4) 요청받은 사용자가 reward 지급받은 이후, 24 시간 안에 친구해제
  //         Ledger = 요청받은 사용자에게 reward 차감 (무효처리)
  //         Ledger = 요청보낸 사용자에게 reward-1 환불
  //
  async deleteFriendship(senderId: number, recipientId: number): Promise<void> {
    // create a new query runner
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // validation ----------------------------------------------------------//
      const friendship = await queryRunner.manager.findOneOrFail(Friendship, {
        where: {
          senderId: senderId,
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

      if (friendship.plea && friendship.plea.status === PleaStatus.PENDING) {
        await queryRunner.manager
          .getRepository(Plea)
          .softDelete(friendship.plea.id);
        const newBalance =
          friendship.recipient.profile?.balance + friendship.plea.reward - 1;

        const ledger = new Ledger({
          debit: friendship.plea.reward - 1,
          ledgerType: LedgerType.DEBIT_REFUND,
          balance: newBalance,
          note: `요청.사례금환불 +${friendship.plea.reward} 🪙  (user: #${friendship.recipient.id}, plea: #${friendship.plea.id})`,
          userId: recipientId,
        });
        await queryRunner.manager.save(ledger);
      }

      await this.repository.manager.query(
        'DELETE FROM `friendship` WHERE senderId = ? AND recipientId = ?',
        [senderId, recipientId],
      );

      await queryRunner.commitTransaction();
    } catch (error) {
      if (error.name === 'EntityNotFoundError') {
        throw new NotFoundException('entity not found');
      } else {
        await queryRunner.rollbackTransaction();
      }
      throw new BadRequestException(error.name ?? error.toString());
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
      .innerJoinAndSelect('friendship.sender', 'sender')
      .innerJoinAndSelect('sender.profile', 'profile')
      .innerJoinAndSelect('friendship.recipient', 'recipient')
      .where({
        recipientId: userId,
        status: Not(FriendshipStatus.ACCEPTED),
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
      .innerJoinAndSelect('friendship.sender', 'sender')
      .innerJoinAndSelect('friendship.recipient', 'recipient')
      .innerJoinAndSelect('recipient.profile', 'profile')
      .where({
        senderId: userId,
        status: Not(FriendshipStatus.ACCEPTED),
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

  // 받거나 보낸 친구신청 리스트 (paginated)
  async getMyFriendships(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Friendship>> {
    const queryBuilder = this.friendshipRepository
      .createQueryBuilder('friendship')
      .innerJoinAndSelect('friendship.sender', 'sender')
      .innerJoinAndSelect('sender.profile', 'sprofile')
      .innerJoinAndSelect('friendship.recipient', 'recipient')
      .innerJoinAndSelect('recipient.profile', 'rprofile')
      .where([{ senderId: userId }, { recipientId: userId }]);

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
      'SELECT status, senderId, recipientId \
      FROM `friendship` \
      WHERE senderId = ? OR recipientId = ?',
      [userId, userId],
    );

    const pendingIds = rows
      .filter((v: any) => v.status !== 'accepted')
      .map((v: any) => {
        return v.senderId === userId ? v.recipientId : v.senderId;
      });

    const friendIds = rows
      .filter((v: any) => v.status === 'accepted')
      .map((v: any) => {
        return v.senderId === userId ? v.recipientId : v.senderId;
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
