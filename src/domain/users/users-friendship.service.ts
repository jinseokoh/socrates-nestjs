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
import { LedgerType, FriendshipStatus } from 'src/common/enums';
import { AnyData } from 'src/common/types';
import { DataSource, Not } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CreateFriendshipDto } from 'src/domain/users/dto/create-friendship.dto';
import { FcmService } from 'src/services/fcm/fcm.service';
import { Friendship } from 'src/domain/users/entities/friendship.entity';
import { Ledger } from 'src/domain/ledgers/entities/ledger.entity';
import { Repository } from 'typeorm/repository/Repository';
import { User } from 'src/domain/users/entities/user.entity';

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
    private dataSource: DataSource, // for transaction
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //?-------------------------------------------------------------------------//
  //? friendship
  //?-------------------------------------------------------------------------//

  //? 친구신청 생성 (코인 비용이 발생할 수 있음.)
  //! balance will be adjusted w/ ledger model event subscriber.
  //! starts a new transaction using query runner.
  //! for hated(blocked) users, app needs to take care of 'em instead of server.
  async createFriendship(
    senderId: number,
    recipientId: number,
    dto: CreateFriendshipDto,
  ): Promise<number> {
    let newBalance = 0;
    // create a new query runner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    const friendshipCount = await queryRunner.manager.count(Friendship, {
      where: [
        { senderId: senderId, recipientId: recipientId },
        { senderId: recipientId, recipientId: senderId },
      ],
    });
    const sender = await queryRunner.manager.findOne(User, {
      where: { id: senderId },
      relations: [`profile`],
    });
    await queryRunner.startTransaction();

    try {
      if (friendshipCount > 0) {
        throw new UnprocessableEntityException(`entity already exists`);
      }
      if (sender?.isBanned) {
        throw new UnprocessableEntityException(`the user is banned`);
      }
      if (
        sender.profile?.balance === null ||
        sender.profile?.balance - dto.cost < 0
      ) {
        throw new BadRequestException(`insufficient balance`);
      }
      newBalance = sender.profile?.balance - dto.cost;
      if (dto.cost > 0) {
        const ledger = new Ledger({
          credit: dto.cost,
          ledgerType: LedgerType.CREDIT_SPEND,
          balance: newBalance,
          note: `친구신청요금 (user #${senderId})`,
          userId: senderId,
        });
        await queryRunner.manager.save(ledger);
      }
      await queryRunner.manager.query(
        'INSERT IGNORE INTO `friendship` (senderId, recipientId, requestFrom, message) VALUES (?, ?, ?, ?)',
        [senderId, recipientId, dto.requestFrom, dto.message],
      );
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
    return newBalance;
  }

  // 친구신청 승인/보류
  async updateFriendshipWithStatus(
    senderId: number,
    recipientId: number,
    status: FriendshipStatus,
  ): Promise<void> {
    await this.repository.manager.query(
      'UPDATE `friendship` SET status = ? WHERE senderId = ? AND recipientId = ?',
      [status, senderId, recipientId],
    );

    const sender = await this.repository.findOneOrFail({
      where: { id: senderId },
    });
    if (status === FriendshipStatus.ACCEPTED) {
      if (sender.pushToken) {
        const fbToken = sender.pushToken;
        const notification = {
          title: 'MeSo',
          body: '상대방이 나의 친구신청을 승락했습니다.',
        };
        this.fcmService.sendToToken(fbToken, notification);
      }
    }
    if (status === FriendshipStatus.PENDING) {
      if (sender.pushToken) {
        const fbToken = sender.pushToken;
        const notification = {
          title: 'MeSo',
          body: '상대방이 나의 친구신청을 보류했습니다.',
        };
        this.fcmService.sendToToken(fbToken, notification);
      }
    }
  }

  // 친구신청 거절/삭제
  async deleteFriendship(senderId: number, recipientId: number): Promise<void> {
    await this.repository.manager.query(
      'DELETE FROM `friendship` WHERE senderId = ? AND recipientId = ?',
      [senderId, recipientId],
    );
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
