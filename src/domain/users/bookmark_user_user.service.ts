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
import { BookmarkUserUser } from 'src/domain/users/entities/bookmark_user_user.entity';
import { UserNotificationEvent } from 'src/domain/users/events/user-notification.event';
import { User } from 'src/domain/users/entities/user.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class BookmarkUserUserService {
  private readonly env: any;
  private readonly logger = new Logger(BookmarkUserUserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(BookmarkUserUser)
    private readonly bookmarkUserUserRepository: Repository<BookmarkUserUser>,
    @Inject(ConfigService) private configService: ConfigService, // global
    private eventEmitter: EventEmitter2,
    private dataSource: DataSource, // for transaction
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //?-------------------------------------------------------------------------//
  //? BookmarkUserUser Pivot
  //?-------------------------------------------------------------------------//

  // User 북마크 생성
  async createUserBookmark(
    userId: number,
    targetUserId: number,
  ): Promise<BookmarkUserUser> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const bookmark = await queryRunner.manager.save(
        queryRunner.manager
          .getRepository(BookmarkUserUser)
          .create({ userId, targetUserId }),
      );
      await queryRunner.manager.query(
        'UPDATE `profile` SET bookmarkCount = bookmarkCount + 1 WHERE userId = ?',
        [targetUserId],
      );

      if (false) {
        // notification with event listener ------------------------------------//
        const targetUser = await queryRunner.manager.findOneOrFail(User, {
          where: { id: targetUserId },
          relations: [`user`, `user.profile`],
        });
        // todo. fine tune notifying logic to dedup the same id
        const event = new UserNotificationEvent();
        event.name = 'userBookmark';
        event.userId = targetUser.id;
        event.token = targetUser.pushToken;
        event.options = targetUser.profile?.options ?? {};
        event.body = `${targetUser.username} 님을 누군가 찜 했습니다.`;
        event.data = {
          page: `users/${targetUserId}`,
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
  async deleteUserBookmark(userId: number, targetUserId: number): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const { affectedRows } = await queryRunner.manager.query(
        'DELETE FROM `bookmark_user_user` WHERE userId = ? AND targetUserId = ?',
        [userId, targetUserId],
      );
      if (affectedRows > 0) {
        await queryRunner.manager.query(
          'UPDATE `profile` SET bookmarkCount = bookmarkCount - 1 WHERE userId = ? AND bookmarkCount > 0',
          [targetUserId],
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
    targetUserId: number,
  ): Promise<AnyData> {
    const [row] = await this.bookmarkUserUserRepository.manager.query(
      'SELECT COUNT(*) AS count \
      FROM `bookmark_user_user` \
      WHERE userId = ? AND targetUserId = ?',
      [userId, targetUserId],
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
        BookmarkUserUser,
        'bookmark_user_user',
        'bookmark_user_user.targetUserId = user.id',
      )
      .leftJoinAndSelect('user.profile', 'profile')
      .where('bookmark_user_user.userId = :userId', { userId });

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
        BookmarkUserUser,
        'bookmark_user_user',
        'bookmark_user_user.targetUserId = user.id',
      )
      .addSelect(['user.*'])
      .where('bookmark_user_user.userId = :userId', { userId })
      .getMany();
  }

  // 내가 북마크한 모든 userIds
  async loadBookmarkedUserIds(userId: number): Promise<number[]> {
    const rows = await this.bookmarkUserUserRepository.manager.query(
      'SELECT targetUserId FROM `bookmark_user_user` \
      WHERE bookmark_user_user.userId = ?',
      [userId],
    );

    return rows.map((v: any) => v.targetUserId);
  }

  //? 새롭게 추가 -----------------------------------------------------------------//

  // 나를 북마크/following하는 Users
  async loadBookmarkingUsers(userId: number): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    return await queryBuilder
      .innerJoinAndSelect(
        BookmarkUserUser,
        'bookmark_user_user',
        'bookmark_user_user.userId = user.id',
      )
      .addSelect(['user.*'])
      .where('bookmark_user_user.targetUserId = :userId', {
        userId,
      })
      .getMany();
  }

  // 나를 북마크/following하는 UserIds
  async loadBookmarkingUserIds(userId: number): Promise<number[]> {
    const rows = await this.bookmarkUserUserRepository.manager.query(
      'SELECT userId FROM `bookmark_user_user` \
      WHERE bookmark_user_user.targetUserId = ?',
      [userId],
    );

    return rows.map((v: any) => v.userId);
  }
}
