import {
  Inject,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Feed } from 'src/domain/feeds/entities/feed.entity';
import { Bookmark } from 'src/domain/users/entities/bookmark.entity';
import { Flag } from 'src/domain/users/entities/flag.entity';
import { Repository } from 'typeorm/repository/Repository';
import { DataSource } from 'typeorm';
import {
  FilterOperator,
  paginate,
  PaginateConfig,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { UserNotificationEvent } from 'src/domain/users/events/user-notification.event';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class UserFeedsService {
  private readonly env: any;
  private readonly logger = new Logger(UserFeedsService.name);

  constructor(
    @InjectRepository(Feed)
    private readonly feedRepository: Repository<Feed>,
    @InjectRepository(Bookmark)
    private readonly bookmarkUserFeedRepository: Repository<Bookmark>,
    @InjectRepository(Flag)
    private readonly flagRepository: Repository<Flag>,
    @Inject(ConfigService) private configService: ConfigService,
    private eventEmitter: EventEmitter2, // global
    private dataSource: DataSource, // for transaction
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //? ----------------------------------------------------------------------- //
  //? 내가 만든 Feeds
  //? ----------------------------------------------------------------------- //

  // 내가 만든 feed 리스트 (paginated)
  async findMyFeeds(
    query: PaginateQuery,
    userId: number,
  ): Promise<Paginated<Feed>> {
    const queryBuilder = this.feedRepository
      .createQueryBuilder('feed')
      .innerJoinAndSelect('feed.user', 'user')
      .leftJoinAndSelect('feed.poll', 'poll')
      .where({
        userId,
      });

    const config: PaginateConfig<Feed> = {
      sortableColumns: ['id'],
      searchableColumns: ['body'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        slug: [FilterOperator.EQ, FilterOperator.IN],
        expiredAt: [FilterOperator.GTE, FilterOperator.LT],
      },
    };

    return await paginate(query, queryBuilder, config);
  }

  // 내가 만든 Feed 리스트 (all)
  async loadMyFeeds(userId: number): Promise<Feed[]> {
    return await this.feedRepository
      .createQueryBuilder('feed')
      .leftJoinAndSelect('feed.poll', 'poll')
      .leftJoinAndSelect('feed.user', 'user')
      .where({
        userId,
      })
      .getMany();
  }

  // 내가 만든 Feed Ids 리스트 (all)
  async loadMyFeedIds(userId: number): Promise<number[]> {
    const items = await this.feedRepository
      .createQueryBuilder('feed')
      .where({
        userId,
      })
      .getMany();
    return items.map((v) => v.id);
  }

  //? ----------------------------------------------------------------------- //
  //? 북마크/찜(Bookmark) 생성
  //? ----------------------------------------------------------------------- //

  async createFeedBookmark(
    userId: number,
    feedId: number,
  ): Promise<Bookmark> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const bookmark = await queryRunner.manager.save(
        queryRunner.manager
          .getRepository(Bookmark)
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
        'DELETE FROM `bookmark` WHERE userId = ? AND feedId = ?',
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
      'SELECT COUNT(*) AS count FROM `bookmark` \
      WHERE userId = ? AND feedId = ?',
      [userId, feedId],
    );
    const { count } = row;

    return +count === 1;
  }

  //? ----------------------------------------------------------------------- //
  //? 내가 북마크한 Feeds
  //? ----------------------------------------------------------------------- //

  // 내가 북마크한 Feeds (paginated)
  async findBookmarkedFeeds(
    query: PaginateQuery,
    userId: number,
  ): Promise<Paginated<Feed>> {
    const queryBuilder = this.feedRepository
      .createQueryBuilder('feed')
      .innerJoinAndSelect(
        Bookmark,
        'bookmark',
        'bookmark.feedId = feed.id',
      )
      .innerJoinAndSelect('feed.user', 'user')
      .where('bookmark.userId = :userId', { userId });

    const config: PaginateConfig<Feed> = {
      sortableColumns: ['id'],
      searchableColumns: ['title'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  // 내가 북마크한 모든 Feeds
  async loadBookmarkedFeeds(userId: number): Promise<Feed[]> {
    const queryBuilder = this.feedRepository.createQueryBuilder('feed');
    return await queryBuilder
      .innerJoinAndSelect(
        Bookmark,
        'bookmark',
        'bookmark.feedId = feed.id',
      )
      .addSelect(['feed.*'])
      .where('bookmark.userId = :userId', { userId })
      .getMany();
  }

  // 내가 북마크한 모든 FeedIds
  async loadBookmarkedFeedIds(userId: number): Promise<number[]> {
    const rows = await this.bookmarkUserFeedRepository.manager.query(
      'SELECT feedId FROM `bookmark` \
      WHERE bookmark.userId = ?',
      [userId],
    );

    return rows.map((v: any) => v.feedId);
  }

  //? ----------------------------------------------------------------------- //
  //? Feed Flag 신고 생성
  //? ----------------------------------------------------------------------- //

  // Feed 신고 생성
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
      await queryRunner.commitTransaction();
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
  //? 내가 신고한 Feeds
  //? ----------------------------------------------------------------------- //

  // 내가 신고한 Feeds (paginated)
  async findFlaggedFeeds(
    query: PaginateQuery,
    userId: number,
  ): Promise<Paginated<Feed>> {
    const queryBuilder = this.feedRepository
      .createQueryBuilder('feed')
      .innerJoin(Flag, 'flag', 'feed.id = flag.entityId')
      .where('flag.userId = :userId', { userId })
      .andWhere('flag.entityType = :entityType', { entityType: 'feed' });

    const config: PaginateConfig<Feed> = {
      sortableColumns: ['id'],
      searchableColumns: ['title'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  // 내가 신고한 모든 Feeds
  async loadFlaggedFeeds(userId: number): Promise<Feed[]> {
    const queryBuilder = this.feedRepository.createQueryBuilder('feed');
    return await queryBuilder
      .innerJoinAndSelect(
        Flag,
        'flag',
        'flag.entityId = feed.id AND flag.entityType = :entityType',
        { entityType: 'feed' },
      )
      .addSelect(['feed.*'])
      .where('flag.userId = :userId', { userId })
      .getMany();
  }

  // 내가 신고한 모든 FeedIds
  async loadFlaggedFeedIds(userId: number): Promise<number[]> {
    const rows = await this.flagRepository.manager.query(
      'SELECT entityId FROM `flag` \
      WHERE flag.entityType = ? AND flag.userId = ?',
      [`feed`, userId],
    );

    return rows.map((v: any) => v.entityId);
  }
}
