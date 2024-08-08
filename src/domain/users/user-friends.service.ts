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
import { DataSource, EntityNotFoundError, Not } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CreateFriendshipDto } from 'src/domain/users/dto/create-friendship.dto';
import { Friendship } from 'src/domain/users/entities/friendship.entity';
import { Ledger } from 'src/domain/ledgers/entities/ledger.entity';
import { Repository } from 'typeorm/repository/Repository';
import { User } from 'src/domain/users/entities/user.entity';
import { Plea } from 'src/domain/icebreakers/entities/plea.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserNotificationEvent } from 'src/domain/users/events/user-notification.event';

// todo. 동작되도록 만들었으나, plea 관련 로직은 변경 필요.
@Injectable()
export class UserFriendsService {
  private readonly env: any;
  private readonly logger = new Logger(UserFriendsService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Friendship)
    private readonly friendshipRepository: Repository<Friendship>,
    @Inject(ConfigService) private configService: ConfigService, // global
    private dataSource: DataSource, // for transaction
    private eventEmitter: EventEmitter2,
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //? ----------------------------------------------------------------------- //
  //? Friendship Pivot
  //? ----------------------------------------------------------------------- //

  //! 친구신청 생성 (using transaction)
  //! - profile's balance will be adjusted w/ ledger model event subscriber.
  //! - for hated(blocked) users, a client needs to take care of 'em instead of server.
  async createFriendship(dto: CreateFriendshipDto): Promise<Friendship> {
    this.logger.log(dto);
    // create a new query runner
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // validation ----------------------------------------------------------//
      const record = await queryRunner.manager.findOne(Friendship, {
        where: [
          { userId: dto.userId, recipientId: dto.recipientId },
          { userId: dto.recipientId, recipientId: dto.userId },
        ],
      });
      if (record) {
        if (record.status === FriendStatus.ACCEPTED) {
          throw new UnprocessableEntityException(`relationship exists`);
        } else {
          throw new UnprocessableEntityException(`entity exists`);
        }
      }

      // validation ----------------------------------------------------------//
      const user = await queryRunner.manager.findOneOrFail(User, {
        where: { id: dto.userId },
        relations: ['profile', 'sentFriendships', 'receivedFriendships'],
      });
      if (user?.isBanned) {
        throw new UnprocessableEntityException(`a banned user`);
      }
      if (
        (dto.cost > 0 && user.profile?.balance === null) ||
        user.profile?.balance - dto.cost < 0
      ) {
        throw new BadRequestException(`insufficient balance`);
      }

      // validation ----------------------------------------------------------//
      const recipient = await queryRunner.manager.findOneOrFail(User, {
        where: { id: dto.recipientId },
        relations: [`profile`],
      });

      if (dto.cost > 0) {
        const newBalance = user.profile?.balance - dto.cost;
        user.profile.balance = newBalance; // no data persistence happens here.
        const ledger = new Ledger({
          credit: dto.cost,
          ledgerType: LedgerType.CREDIT_SPEND,
          balance: newBalance,
          note: `친구 신청료 (대상#${dto.recipientId})`,
          userId: dto.userId,
        });
        await queryRunner.manager.save(ledger);
      }

      const friendship = await queryRunner.manager.save(
        queryRunner.manager.getRepository(Friendship).create({
          userId: dto.userId,
          recipientId: dto.recipientId,
          message: dto.message,
        }),
      );
      await queryRunner.commitTransaction();

      // notification with event listener ------------------------------------//
      const event = new UserNotificationEvent();
      event.name = 'friend';
      event.userId = recipient.id;
      event.token = recipient.pushToken;
      event.options = recipient.profile?.options ?? {};
      event.body = `${user.username}님으로부터 친구신청을 받았습니다. ${dto.message}`;
      event.data = {
        page: 'mypage/requests', //! mypage/friendrequests
      };
      this.eventEmitter.emit('user.notified', event);

      return friendship;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error.code === 'ER_DUP_ENTRY') {
        throw new UnprocessableEntityException(`entity exists`);
      } else if (error.name === 'EntityNotFoundError') {
        throw new NotFoundException(`user not found`);
      } else {
        throw error;
      }
    } finally {
      await queryRunner.release();
    }
  }

  // -------------------------------------------------------------------------//
  // Delete
  // -------------------------------------------------------------------------//
  //! 친구신청 삭제 (using transaction) 반대는 수락
  async deleteFriendship(userId: number, id: number): Promise<any> {
    // create a new query runner
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // validation ----------------------------------------------------------//
      const friendship = await queryRunner.manager.findOne(Friendship, {
        where: { id: id },
      });
      if (friendship.userId !== userId && friendship.recipientId !== userId) {
        throw new UnprocessableEntityException('mind your id');
      }

      const { affectedRows } = await queryRunner.manager.query(
        'DELETE FROM `friendship` WHERE id = ?',
        [id],
      );
      await queryRunner.commitTransaction();
      return { data: affectedRows };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error.name === 'EntityNotFoundError') {
        //! TypeORM의 EntityNotFoundError 감지
        throw new NotFoundException(`entity not found`);
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
  //! 친구신청 수락 (using transaction) 반대는 삭제
  async acceptFriendship(userId: number, id: number): Promise<Friendship> {
    // create a new query runner
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // validation ----------------------------------------------------------//
      const friendship = await queryRunner.manager.findOne(Friendship, {
        where: { id: id },
        relations: ['user', 'user.profile', 'recipient'],
      });

      if (friendship.recipientId !== userId) {
        throw new UnprocessableEntityException('mind your id');
      }

      if (friendship) {
        await queryRunner.manager.query(
          'UPDATE `friendship` SET status = ? WHERE id = ?',
          [FriendStatus.ACCEPTED, id],
        );

        const event = new UserNotificationEvent();
        event.name = 'friend';
        event.userId = friendship.user?.id;
        event.token = friendship.user?.pushToken;
        event.options = friendship.user?.profile?.options ?? {};
        event.body = `${friendship.recipient.username}님이 신청을 수락하여 친구관계를 맺었습니다.`;
        event.data = {
          page: `mypage/friends`,
        };
        this.eventEmitter.emit('user.notified', event);
      }
      await queryRunner.commitTransaction();

      delete friendship.user;
      delete friendship.recipient;
      friendship.status = FriendStatus.ACCEPTED;

      return friendship;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error.name === 'EntityNotFoundError') {
        //! TypeORM의 EntityNotFoundError 감지
        throw new NotFoundException(`entity not found`);
      } else {
        throw error;
      }
    } finally {
      await queryRunner.release();
    }
  }

  // ------------------------------------------------------------------------ //

  //? 내가 친구신청 보낸 Friendships (paginated)
  //? message 때문에 Friendship 으로 보내야 한다.
  async listFriendshipsSent(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Friendship>> {
    const queryBuilder = this.friendshipRepository
      .createQueryBuilder('friendship')
      .innerJoinAndSelect('friendship.user', 'user')
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

  //? 내가 친구신청 받은 Friendships (paginated)
  //? message 때문에 Friendship 으로 보내야 한다.
  async listFriendshipsReceived(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Friendship>> {
    const queryBuilder = this.friendshipRepository
      .createQueryBuilder('friendship')
      .innerJoinAndSelect('friendship.user', 'user')
      .innerJoinAndSelect('friendship.recipient', 'recipient')
      .innerJoinAndSelect('user.profile', 'profile')
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

  // 현재 친구관계인 Users (paginated)
  async listMyFriends(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<User>> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .innerJoin(Friendship, 'friendship', 'friendship.status = :status', {
        status: FriendStatus.ACCEPTED,
      })
      .innerJoinAndSelect('user.profile', 'profile')
      .where(
        '(friendship.userId = :userId AND user.id = friendship.recipientId) OR (friendship.recipientId = :userId AND user.id = friendship.userId)',
        { userId },
      );
    const config: PaginateConfig<User> = {
      sortableColumns: ['createdAt'],
      defaultLimit: 20,
      defaultSortBy: [['createdAt', 'DESC']],
      filterableColumns: {
        status: [FilterOperator.EQ],
      },
    };

    return await paginate(query, queryBuilder, config);
  }

  // 현재 친구관계인 UserIds (all)
  async loadFriendships(userId: number): Promise<{
    pendingIds: number[];
    friendIds: number[];
  }> {
    const items = await this.friendshipRepository.find({
      where: [{ userId: userId }, { recipientId: userId }],
    });

    const pendingIds = [...items]
      .filter((v) => v.status !== 'accepted')
      .map((v) => (v.userId === userId ? v.recipientId : v.userId));
    const friendIds = [...items]
      .filter((v) => v.status === 'accepted')
      .map((v) => (v.userId === userId ? v.recipientId : v.userId));

    // return the deduped result
    return {
      pendingIds: Array.from(new Set(pendingIds)),
      friendIds: Array.from(new Set(friendIds)),
    };
  }

  // 현재 친구관계인 UserIds (all)
  async loadFriendUserIds(userId: number): Promise<number[]> {
    const query = `
      SELECT DISTINCT
        CASE
          WHEN friendship.userId = ? THEN friendship.recipientId
          ELSE friendship.userId
        END AS friendId
      FROM
        friendship
      WHERE
        friendship.status = 'accepted' AND (
          friendship.userId = ? OR
          friendship.recipientId = ?
        );
    `;
    const items = await this.userRepository.manager.query(query, [
      userId,
      userId,
      userId,
    ]);

    return items.map(({ friendId }) => +friendId);
  }

  // pending 친구관계인 UserIds (all)
  async loadPendingFriendUserIds(userId: number): Promise<number[]> {
    const query = `
      SELECT DISTINCT
        CASE
          WHEN friendship.userId = ? THEN friendship.recipientId
          ELSE friendship.userId
        END AS friendId
      FROM
        friendship
      WHERE
        friendship.status = 'pending' AND (
          friendship.userId = ? OR
          friendship.recipientId = ?
        );
    `;
    const items = await this.userRepository.manager.query(query, [
      userId,
      userId,
      userId,
    ]);

    return items.map(({ friendId }) => +friendId);
  }
}
