import {
  Inject,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm/repository/Repository';
import { Flag } from 'src/domain/users/entities/flag.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { UserNotificationEvent } from 'src/domain/users/events/user-notification.event';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Feed } from 'src/domain/feeds/entities/feed.entity';
import { BookmarkUserFeed } from 'src/domain/users/entities/bookmark_user_feed.entity';

@Injectable()
export class FeedUsersService {
  private readonly env: any;
  private readonly logger = new Logger(FeedUsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Flag)
    private readonly flagRepository: Repository<Flag>,
    @InjectRepository(BookmarkUserFeed)
    private readonly bookmarkUserFeedRepository: Repository<BookmarkUserFeed>,
    @Inject(ConfigService) private configService: ConfigService, // global
    private eventEmitter: EventEmitter2,
    private dataSource: DataSource, // for transaction
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //? ----------------------------------------------------------------------- //
  //? 북마크/찜(BookmarkUserFeed) 생성
  //? ----------------------------------------------------------------------- //

  async createFeedBookmark(
    userId: number,
    feedId: number,
  ): Promise<BookmarkUserFeed> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const bookmark = await queryRunner.manager.save(
        queryRunner.manager
          .getRepository(BookmarkUserFeed)
          .create({ userId, feedId }),
      );
      await queryRunner.manager.query(
        'UPDATE `feed` SET bookmarkCount = bookmarkCount + 1 WHERE id = ?',
        [feedId],
      );

      if (false) {
        // notification with event listener ------------------------------------//
        const feed = await queryRunner.manager.findOneOrFail(Feed, {
          where: { id: feedId },
          relations: [`user`, `user.profile`],
        });
        // todo. fine tune notifying logic to dedup the same id
        const event = new UserNotificationEvent();
        event.name = 'feed';
        event.userId = feed.user.id;
        event.token = feed.user.pushToken;
        event.options = feed.user.profile?.options ?? {};
        event.body = `${feed.title} 모임에 누군가 찜을 했습니다.`;
        event.data = {
          page: `feeds/${feedId}`,
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

  async deleteFeedBookmark(userId: number, feedId: number): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const { affectedRows } = await queryRunner.manager.query(
        'DELETE FROM `bookmark_user_feed` WHERE userId = ? AND feedId = ?',
        [userId, feedId],
      );
      if (affectedRows > 0) {
        await queryRunner.manager.query(
          'UPDATE `feed` SET bookmarkCount = bookmarkCount - 1 WHERE id = ? AND bookmarkCount > 0',
          [feedId],
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

  // Feed 북마크 여부
  async isFeedBookmarked(userId: number, feedId: number): Promise<boolean> {
    const [row] = await this.bookmarkUserFeedRepository.manager.query(
      'SELECT COUNT(*) AS count FROM `bookmark_user_feed` \
      WHERE userId = ? AND feedId = ?',
      [userId, feedId],
    );
    const { count } = row;

    return +count === 1;
  }

  //? ----------------------------------------------------------------------- //
  //? 북마크 (BookmarkUserMeetup) 리스트
  //? ----------------------------------------------------------------------- //

  // 이 Feed를 북마크한 모든 Users
  async loadBookmarkingUsers(feedId: number): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    return await queryBuilder
      .innerJoinAndSelect(
        BookmarkUserFeed,
        'bookmark_user_feed',
        'bookmark_user_feed.userId = user.id',
      )
      .addSelect(['user.*'])
      .where('bookmark_user_feed.feedId = :feedId', {
        feedId,
      })
      .getMany();
  }

  // 이 Feed를 북마크한 모든 UserIds
  async loadBookmarkingUserIds(feedId: number): Promise<number[]> {
    const rows = await this.userRepository.manager.query(
      'SELECT userId FROM `bookmark_user_feed` \
      WHERE bookmark_user_feed.feedId = ?',
      [feedId],
    );

    return rows.map((v: any) => v.userId);
  }

  //? ----------------------------------------------------------------------- //
  //? Feed Flag 신고 생성
  //? ----------------------------------------------------------------------- //

  // Feed 신고 생성
  // 가능하다면, feed flagCount 증가
  async createFeedFlag(
    userId: number,
    feedId: number,
    message: string,
  ): Promise<Flag> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const flag = await queryRunner.manager.save(
        queryRunner.manager.getRepository(Flag).create({
          userId,
          entityType: 'feed',
          entityId: feedId,
          message,
        }),
      );
      await queryRunner.manager.query(
        'UPDATE `feed` SET flagCount = flagCount + 1 WHERE id = ?',
        [feedId],
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

  // Feed 신고 제거
  // 가능하다면, feed flagCount 감소
  async deleteFeedFlag(userId: number, feedId: number): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const { affectedRows } = await queryRunner.manager.query(
        'DELETE FROM `flag` where userId = ? AND entityType = ? AND entityId = ?',
        [userId, `feed`, feedId],
      );
      if (affectedRows > 0) {
        await queryRunner.manager.query(
          'UPDATE `feed` SET flagCount = flagCount - 1 WHERE id = ? AND flagCount > 0',
          [feedId],
        );
      }
      return { data: affectedRows };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Feed 신고 여부
  async isFeedFlagged(userId: number, feedId: number): Promise<boolean> {
    const [row] = await this.flagRepository.manager.query(
      'SELECT COUNT(*) AS count FROM `flag` \
      WHERE userId = ? AND entityType = ? AND entityId = ?',
      [userId, `feed`, feedId],
    );
    const { count } = row;

    return +count === 1;
  }

  //? ----------------------------------------------------------------------- //
  //? 신고 (Flag) 리스트
  //? ----------------------------------------------------------------------- //

  // 이 Feed를 신고한 모든 Users (all)
  async loadFeedFlaggingUsers(feedId: number): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    return await queryBuilder
      .innerJoinAndSelect(Flag, 'flag', 'flag.userId = user.id')
      .addSelect(['user.*'])
      .where('flag.entityType = :entityType AND flag.entityId = :feedId', {
        entityType: `feed`,
        feedId,
      })
      .getMany();
  }

  // 이 Feed를 신고한 모든 UserIds (all)
  async loadFeedFlaggingUserIds(feedId: number): Promise<number[]> {
    const rows = await this.flagRepository.manager.query(
      'SELECT userId FROM `flag` \
      WHERE flag.entityType = ? AND flag.entityId = ?',
      [`feed`, feedId],
    );

    return rows.map((v: any) => v.userId);
  }
}
