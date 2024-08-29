import {
  Inject,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  PaginateConfig,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { AnyData } from 'src/common/types';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm/repository/Repository';
import { Bookmark } from 'src/domain/users/entities/bookmark.entity';
import { UserNotificationEvent } from 'src/domain/users/events/user-notification.event';
import { User } from 'src/domain/users/entities/user.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Flag } from 'src/domain/users/entities/flag.entity';
import { Like } from 'src/domain/users/entities/like.entity';

@Injectable()
export class UserUsersService {
  private readonly env: any;
  private readonly logger = new Logger(UserUsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Bookmark)
    private readonly bookmarkRepository: Repository<Bookmark>,
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @InjectRepository(Flag)
    private readonly flagRepository: Repository<Flag>,
    @Inject(ConfigService) private configService: ConfigService, // global
    private eventEmitter: EventEmitter2,
    private dataSource: DataSource, // for transaction
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //? ----------------------------------------------------------------------- //
  //? Bookmark Pivot
  //? ----------------------------------------------------------------------- //

  // User 북마크 생성
  async createUserBookmark(
    userId: number,
    recipientId: number,
  ): Promise<Bookmark> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const bookmark = await queryRunner.manager.save(
        queryRunner.manager.getRepository(Bookmark).create({
          userId,
          entityType: 'user',
          entityId: recipientId,
        }),
      );
      await queryRunner.manager.query(
        'UPDATE `profile` SET bookmarkCount = bookmarkCount + 1 WHERE userId = ?',
        [recipientId],
      );

      if (false) {
        // notification with event listener ------------------------------------//
        const recipient = await queryRunner.manager.findOneOrFail(User, {
          where: { id: recipientId },
          relations: [`user`, `user.profile`],
        });
        // todo. fine tune notifying logic to dedup the same id
        const event = new UserNotificationEvent();
        event.name = 'user';
        event.userId = recipient.id;
        event.token = recipient.pushToken;
        event.options = recipient.profile?.options ?? {};
        event.body = `${recipient.username} 님을 누군가 찜 했습니다.`;
        event.data = {
          page: `users/${recipientId}`,
          args: '',
        };
        this.eventEmitter.emit('user.notified', event);
      }

      await queryRunner.commitTransaction();
      return bookmark;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error.code === 'ER_DUP_ENTRY') {
        throw new UnprocessableEntityException(`entity exists`);
      } else {
        throw error;
      }
    } finally {
      await queryRunner.release();
    }
  }

  // User 북마크 제거
  async deleteUserBookmark(userId: number, recipientId: number): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const { affectedRows } = await queryRunner.manager.query(
        'DELETE FROM `bookmark` WHERE userId = ? AND recipientId = ?',
        [userId, recipientId],
      );
      if (affectedRows > 0) {
        await queryRunner.manager.query(
          'UPDATE `profile` SET bookmarkCount = bookmarkCount - 1 WHERE userId = ? AND bookmarkCount > 0',
          [recipientId],
        );
      }
      await queryRunner.commitTransaction();
      return { data: affectedRows };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // User 북마크 여부
  async isUserBookmarked(
    userId: number,
    recipientId: number,
  ): Promise<AnyData> {
    const [row] = await this.bookmarkRepository.manager.query(
      'SELECT COUNT(*) AS count \
      FROM `bookmark` \
      WHERE userId = ? AND recipientId = ?',
      [userId, recipientId],
    );
    const { count } = row;

    return { data: +count };
  }

  // 내가 북마크한 Users (paginated)
  async findBookmarkedUsers(
    query: PaginateQuery,
    userId: number,
  ): Promise<Paginated<User>> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect(
        Bookmark,
        'bookmark',
        'bookmark.recipientId = user.id',
      )
      .leftJoinAndSelect('user.profile', 'profile')
      .where('bookmark.userId = :userId', { userId });

    const config: PaginateConfig<User> = {
      sortableColumns: ['id'],
      searchableColumns: ['username'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'ASC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  // 내가 북마크한 모든 Users
  async loadBookmarkedUsers(userId: number): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    return await queryBuilder
      .innerJoinAndSelect(
        Bookmark,
        'bookmark',
        'bookmark.recipientId = user.id',
      )
      .addSelect(['user.*'])
      .where('bookmark.userId = :userId', { userId })
      .getMany();
  }

  // 내가 북마크한 모든 userIds
  async loadBookmarkedUserIds(userId: number): Promise<number[]> {
    const rows = await this.bookmarkRepository.manager.query(
      'SELECT recipientId FROM `bookmark` \
      WHERE bookmark.userId = ?',
      [userId],
    );

    return rows.map((v: any) => v.recipientId);
  }

  //? 새롭게 추가 -----------------------------------------------------------------//

  // 나를 북마크/following하는 Users
  async loadBookmarkingUsers(userId: number): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    return await queryBuilder
      .innerJoinAndSelect(Bookmark, 'bookmark', 'bookmark.userId = user.id')
      .addSelect(['user.*'])
      .where('bookmark.recipientId = :userId', {
        userId,
      })
      .getMany();
  }

  // 나를 북마크/following하는 UserIds
  async loadBookmarkingUserIds(userId: number): Promise<number[]> {
    const rows = await this.bookmarkRepository.manager.query(
      'SELECT userId FROM `bookmark` \
      WHERE bookmark.recipientId = ?',
      [userId],
    );

    return rows.map((v: any) => v.userId);
  }

  //? ----------------------------------------------------------------------- //
  //? Likes
  //? ----------------------------------------------------------------------- //

  // User 신고 생성
  // 가능하다면, user likeCount 증가
  async createUserLike(userId: number, recipientId: number): Promise<Like> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const like = await queryRunner.manager.save(
        queryRunner.manager.getRepository(Like).create({
          userId,
          entityType: 'user',
          entityId: recipientId,
        }),
      );
      await queryRunner.manager.query(
        'UPDATE `profile` SET likeCount = likeCount + 1 WHERE userId = ?',
        [recipientId],
      );
      await queryRunner.commitTransaction();
      return like;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error.code === 'ER_DUP_ENTRY') {
        throw new UnprocessableEntityException(`entity exists`);
      } else {
        throw error;
      }
    } finally {
      await queryRunner.release();
    }
  }

  // User 신고 제거
  // 가능하다면, user likeCount 감소
  async deleteUserLike(userId: number, recipientId: number): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const { affectedRows } = await queryRunner.manager.query(
        'DELETE FROM `like` where userId = ? AND entityType = ? AND entityId = ?',
        [userId, `user`, recipientId],
      );
      if (affectedRows > 0) {
        await queryRunner.manager.query(
          'UPDATE `profile` SET likeCount = likeCount - 1 WHERE userId = ? AND likeCount > 0',
          [recipientId],
        );
      }
      await queryRunner.commitTransaction();
      return { data: affectedRows };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // User 신고 여부
  async isUserLikeged(userId: number, recipientId: number): Promise<boolean> {
    const [row] = await this.likeRepository.manager.query(
      'SELECT COUNT(*) AS count FROM `like` \
      WHERE userId = ? AND entityType = ? AND entityId = ?',
      [userId, `user`, recipientId],
    );
    const { count } = row;

    return +count === 1;
  }

  // 내가 신고한 Users (paginated)
  async findLikegedUsers(
    query: PaginateQuery,
    userId: number,
  ): Promise<Paginated<User>> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .innerJoin(Like, 'like', 'like.entityId = user.id')
      .where('like.userId = :userId', { userId })
      .andWhere('like.entityType = :entityType', { entityType: 'user' });

    const config: PaginateConfig<User> = {
      sortableColumns: ['id'],
      searchableColumns: ['username'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  // 내가 신고한 모든 Users
  async loadLikegedUsers(userId: number): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    return await queryBuilder
      .innerJoinAndSelect(
        Like,
        'like',
        'like.entityId = user.id AND like.entityType = :entityType',
        { entityType: 'user' },
      )
      .addSelect(['user.*'])
      .where('like.userId = :userId', { userId })
      .getMany();
  }

  // 내가 신고한 모든 UserIds
  async loadLikegedUserIds(userId: number): Promise<number[]> {
    const rows = await this.likeRepository.manager.query(
      'SELECT entityId FROM `like` \
      WHERE like.userId = ? AND like.entityType = ?',
      [userId, 'user'],
    );

    return rows.map((v: any) => v.entityId);
  }

  //? ----------------------------------------------------------------------- //
  //? Flags
  //? ----------------------------------------------------------------------- //

  // User 신고 생성
  // 가능하다면, user flagCount 증가
  async createUserFlag(
    userId: number,
    recipientId: number,
    message: string | null,
  ): Promise<Flag> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const flag = await queryRunner.manager.save(
        queryRunner.manager.getRepository(Flag).create({
          userId,
          entityType: 'user',
          entityId: recipientId,
          message,
        }),
      );
      await queryRunner.manager.query(
        'UPDATE `profile` SET flagCount = flagCount + 1 WHERE userId = ?',
        [recipientId],
      );
      await queryRunner.commitTransaction();
      return flag;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error.code === 'ER_DUP_ENTRY') {
        throw new UnprocessableEntityException(`entity exists`);
      } else {
        throw error;
      }
    } finally {
      await queryRunner.release();
    }
  }

  // User 신고 제거
  // 가능하다면, user flagCount 감소
  async deleteUserFlag(userId: number, recipientId: number): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const { affectedRows } = await queryRunner.manager.query(
        'DELETE FROM `flag` where userId = ? AND entityType = ? AND entityId = ?',
        [userId, `user`, recipientId],
      );
      if (affectedRows > 0) {
        await queryRunner.manager.query(
          'UPDATE `profile` SET flagCount = flagCount - 1 WHERE userId = ? AND flagCount > 0',
          [recipientId],
        );
      }
      await queryRunner.commitTransaction();
      return { data: affectedRows };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // User 신고 여부
  async isUserFlagged(userId: number, recipientId: number): Promise<boolean> {
    const [row] = await this.flagRepository.manager.query(
      'SELECT COUNT(*) AS count FROM `flag` \
      WHERE userId = ? AND entityType = ? AND entityId = ?',
      [userId, `user`, recipientId],
    );
    const { count } = row;

    return +count === 1;
  }

  // 내가 신고한 Users (paginated)
  async findFlaggedUsers(
    query: PaginateQuery,
    userId: number,
  ): Promise<Paginated<User>> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .innerJoin(Flag, 'flag', 'flag.entityId = user.id')
      .where('flag.userId = :userId', { userId })
      .andWhere('flag.entityType = :entityType', { entityType: 'user' });

    const config: PaginateConfig<User> = {
      sortableColumns: ['id'],
      searchableColumns: ['username'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  // 내가 신고한 모든 Users
  async loadFlaggedUsers(userId: number): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    return await queryBuilder
      .innerJoinAndSelect(
        Flag,
        'flag',
        'flag.entityId = user.id AND flag.entityType = :entityType',
        { entityType: 'user' },
      )
      .addSelect(['user.*'])
      .where('flag.userId = :userId', { userId })
      .getMany();
  }

  // 내가 신고한 모든 UserIds
  async loadFlaggedUserIds(userId: number): Promise<number[]> {
    const rows = await this.flagRepository.manager.query(
      'SELECT entityId FROM `flag` \
      WHERE flag.userId = ? AND flag.entityType = ?',
      [userId, 'user'],
    );

    return rows.map((v: any) => v.entityId);
  }

  //? 새롭게 추가 -----------------------------------------------------------------//

  // 나를 신고한 모든 Users
  async loadUserFlaggingUsers(userId: number): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    return await queryBuilder
      .innerJoinAndSelect(
        Flag,
        'flag',
        'flag.entityId = user.id AND flag.entityType = :entityType',
        { entityType: 'user' },
      )
      .addSelect(['user.*'])
      .where('flag.userId = :userId', { userId })
      .getMany();
  }

  // 나를 신고한 모든 UserIds
  async loadUserFlaggingUserIds(userId: number): Promise<number[]> {
    const rows = await this.flagRepository.manager.query(
      'SELECT entityId FROM `flag` \
      WHERE flag.userId = ? AND flag.entityType = ?',
      [userId, 'user'],
    );

    return rows.map((v: any) => v.entityId);
  }
}
