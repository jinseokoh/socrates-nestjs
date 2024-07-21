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
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { AnyData } from 'src/common/types';
import { DataSource } from 'typeorm';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm/repository/Repository';
import { BookmarkUserFeed } from 'src/domain/users/entities/bookmark_user_feed.entity';
import { Feed } from 'src/domain/feeds/entities/feed.entity';

@Injectable()
export class BookmarkUserFeedService {
  private readonly env: any;
  private readonly logger = new Logger(BookmarkUserFeedService.name);

  constructor(
    @InjectRepository(BookmarkUserFeed)
    private readonly bookmarkUserFeedRepository: Repository<BookmarkUserFeed>,
    @InjectRepository(Feed)
    private readonly feedRepository: Repository<Feed>,
    @Inject(ConfigService) private configService: ConfigService, // global
    @Inject(CACHE_MANAGER) private cacheManager: Cache, // global
    private dataSource: DataSource, // for transaction
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //?-------------------------------------------------------------------------//
  //? BookmarkUserFeed Pivot
  //?-------------------------------------------------------------------------//

  // Feed 북마크 생성
  // feed 의 bookmarkCount++
  async createFeedBookmark(
    userId: number,
    feedId: number,
    message: string | null,
  ): Promise<BookmarkUserFeed> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const bookmark = await queryRunner.manager.save(
        queryRunner.manager
          .getRepository(BookmarkUserFeed)
          .create({ userId, feedId, message }),
      );
      await queryRunner.manager.query(
        'UPDATE `feed` SET bookmarkCount = bookmarkCount + 1 WHERE id = ?',
        [feedId],
      );
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

  // Feed 북마크 제거
  // feed 의 bookmarkCount--
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

  // 내가 북마크한 feed 리스트 (paginated)
  async findBookmarkedFeeds(
    query: PaginateQuery,
    userId: number,
  ): Promise<Paginated<Feed>> {
    const queryBuilder = this.feedRepository
      .createQueryBuilder('feed')
      .innerJoinAndSelect(
        BookmarkUserFeed,
        'bookmark_user_feed',
        'feed.id = bookmark_user_feed.feedId',
      )
      .innerJoinAndSelect('feed.user', 'user')
      .where('bookmark_user_feed.userId = :userId', { userId });

    const config: PaginateConfig<Feed> = {
      sortableColumns: ['id'],
      searchableColumns: ['body'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'ASC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  // 내가 북마크한 모든 feeds
  async loadBookmarkedFeeds(userId: number): Promise<Feed[]> {
    const queryBuilder = this.feedRepository.createQueryBuilder('feed');
    return queryBuilder
      .innerJoinAndSelect(
        BookmarkUserFeed,
        'bookmark_user_feed',
        'feed.id = bookmark_user_feed.feedId',
      )
      .addSelect(['feed.*'])
      .where('bookmark_user_feed.userId = :userId', { userId })
      .getMany();
  }

  // 내가 북마크한 모든 feedIds
  async loadBookmarkedFeedIds(userId: number): Promise<number[]> {
    const rows = await this.bookmarkUserFeedRepository.manager.query(
      'SELECT feedId FROM `bookmark_user_feed` \
      WHERE bookmark_user_feed.userId = ?',
      [userId],
    );

    return rows.map((v: any) => v.feedId);
  }

  // 내가 북마크한 feed 여부
  async isFeedBookmarked(userId: number, feedId: number): Promise<boolean> {
    const [row] = await this.bookmarkUserFeedRepository.manager.query(
      'SELECT COUNT(*) AS count FROM `bookmark_user_feed` \
      WHERE userId = ? AND feedId = ?',
      [userId, feedId],
    );
    const { count } = row;

    return +count === 1;
  }
}
