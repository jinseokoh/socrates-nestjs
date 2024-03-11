import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
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
import { FcmService } from 'src/services/fcm/fcm.service';
import { Friendship } from 'src/domain/users/entities/friendship.entity';
import { Ledger } from 'src/domain/ledgers/entities/ledger.entity';
import { Repository } from 'typeorm/repository/Repository';
import { User } from 'src/domain/users/entities/user.entity';
import { Plea } from 'src/domain/users/entities/plea.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FriendAttachedEvent } from 'src/domain/users/events/friend-attached.event';

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
    private readonly fcmService: FcmService,
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

  //? 친구신청 생성 (코인 비용이 발생할 수 있음.)
  //! balance will be adjusted w/ ledger model event subscriber.
  //! starts a new transaction using query runner.
  //! for hated(blocked) users, app needs to take care of 'em instead of server.
  async createFriendship(dto: CreateFriendshipDto): Promise<Friendship> {
    // create a new query runner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    // validation checks
    const friendship = await queryRunner.manager.findOneOrFail(Friendship, {
      where: [
        { senderId: dto.senderId, recipientId: dto.recipientId },
        { senderId: dto.recipientId, recipientId: dto.senderId },
      ],
    });
    if (friendship) {
      if (friendship.status === FriendshipStatus.ACCEPTED) {
        throw new UnprocessableEntityException(`already in a relationship`);
      } else {
        // friendship 이미 존재
        throw new UnprocessableEntityException(`entity already exists`);
      }
    }

    // validation checks
    const sender = await queryRunner.manager.findOneOrFail(User, {
      where: { id: dto.senderId },
      relations: [`profile`],
    });
    if (sender?.isBanned) {
      throw new UnprocessableEntityException(`the user is banned`);
    }
    if (
      sender.profile?.balance === null ||
      sender.profile?.balance - dto.cost < 0
    ) {
      throw new BadRequestException(`insufficient balance`);
    }

    // initialize
    const newBalance = sender.profile?.balance - dto.cost;

    try {
      await queryRunner.startTransaction();
      if (dto.cost > 0) {
        const ledger = new Ledger({
          credit: dto.cost,
          ledgerType: LedgerType.CREDIT_SPEND,
          balance: newBalance,
          note: `친구.신청료 (user: #${dto.senderId})`,
          userId: dto.senderId,
        });
        await queryRunner.manager.save(ledger);
      }
      const friendship = await queryRunner.manager.query(
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

      return friendship;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // -------------------------------------------------------------------------//
  // Update
  // -------------------------------------------------------------------------//

  //! 친구신청 수락할때만
  async updateFriendshipWithStatus(
    senderId: number,
    recipientId: number,
    status: FriendshipStatus,
  ): Promise<void> {
    // create a new query runner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    // validation
    const friendship = await queryRunner.manager.findOneOrFail<Friendship>(
      Friendship,
      {
        where: {
          senderId: senderId,
          recipientId: recipientId,
        },
        relations: ['sender', 'sender.profile', 'plea'],
      },
    );

    try {
      await queryRunner.startTransaction();

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
        // plea.reward 를 friendship sender (= plea recipient) 에게 100% 제공
        const newBalance =
          friendship.sender.profile?.balance + friendship.plea.reward;
        const ledger = new Ledger({
          debit: friendship.plea.reward,
          ledgerType: LedgerType.DEBIT_REWARD,
          balance: newBalance,
          note: `요청 사례금 제공 (user: #${friendship.sender.id}, plea: #${friendship.plea.id})`,
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

      const event = new FriendAttachedEvent();
      event.token = friendship.sender?.pushToken;
      event.options = friendship.sender?.profile?.options ?? {
        meetupLike: false, // 모임 찜
        meetupThread: false, // 모임 댓글
        meetupRequest: false, // 모임신청
        meetupRequestApproval: false, // 모임신청 승인
        meetupInviteApproval: false, // 모임초대 승인
        connectionReaction: false, // 발견 공감
        connectionRemark: false, // 발견 댓글
        friendRequest: false, // 친구 신청
        friendRequestApproval: false, // 친구신청 승인
        friendRequestFeedback: false, // 친구신청 발견글 요청
        friendMeetupSubmit: false, // 친구가 모임 등록
        friendConnectionSubmit: false, // 친구가 발견글 등록
      };
      event.notification = {
        title: 'MeSo',
        body: friendship.plea
          ? `답글을 요청한 상대방이 친구관계를 수락하여, ${friendship.plea.reward}코인을 제공했습니다.`
          : '상대방이 나의 친구신청을 수락했습니다.',
      };
      this.eventEmitter.emit('friend.attached', event);
    } catch (err) {
      console.error(err);
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    // const sender = await this.repository.findOneOrFail({
    //   where: { id: senderId },
    // });
    // if (status === FriendshipStatus.ACCEPTED) {
    //   // see if this friendship comes with plea
    //   // - plea 이면 senderId 에게 plea.reward 전달
    //   if (sender.pushToken) {
    //     const fbToken = sender.pushToken;
    //     const notification = {
    //       title: 'MeSo',
    //       body: '상대방이 나의 친구신청을 수락했습니다.',
    //     };
    //     this.fcmService.sendToToken(fbToken, notification);
    //   }
    // }
  }

  // -------------------------------------------------------------------------//
  // Delete
  // -------------------------------------------------------------------------//

  // API 호출 시나리오
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
    await queryRunner.connect();

    // validation checks
    const recipient = await queryRunner.manager.findOneOrFail(User, {
      where: { id: recipientId },
      relations: [`profile`],
    });

    // validation check
    const friendship = await queryRunner.manager.findOneOrFail(Friendship, {
      where: {
        senderId: senderId,
        recipientId: recipientId,
      },
    });

    try {
      await queryRunner.startTransaction();
      if (friendship.pleaId) {
        const plea = await queryRunner.manager.findOneOrFail(Plea, {
          where: {
            id: friendship.pleaId,
          },
        });

        if (plea.status === PleaStatus.PENDING) {
          await queryRunner.manager.getRepository(Plea).softDelete(plea.id);
          const newBalance = recipient.profile?.balance + plea.reward - 1;

          const ledger = new Ledger({
            debit: plea.reward - 1,
            ledgerType: LedgerType.DEBIT_REFUND,
            balance: newBalance,
            note: `요청 사례금 환불 (user: #${recipientId})`,
            userId: recipientId,
          });
          await queryRunner.manager.save(ledger);
        }
      }
      await this.repository.manager.query(
        'DELETE FROM `friendship` WHERE senderId = ? AND recipientId = ?',
        [senderId, recipientId],
      );

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
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
