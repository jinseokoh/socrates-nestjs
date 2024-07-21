import { Inject, Injectable, Logger } from '@nestjs/common';
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

  // 나의 북마크에서 feed 추가
  async attach(
    userId: number,
    feedId: number,
    message: string | null,
  ): Promise<AnyData> {
    try {
      const { affectedRows } =
        await this.bookmarkUserFeedRepository.manager.query(
          'INSERT IGNORE INTO `bookmark_user_feed` (userId, feedId, message) VALUES (?, ?, ?) \
  ON DUPLICATE KEY UPDATE \
  userId = VALUES(`userId`), \
  feedId = VALUES(`feedId`), \
  message = VALUES(`message`)',
          [userId, feedId, message],
        );
      return { data: affectedRows };
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  // 나의 북마크에서 feed 제거
  async detach(userId: number, feedId: number): Promise<AnyData> {
    try {
      const { affectedRows } =
        await this.bookmarkUserFeedRepository.manager.query(
          'DELETE FROM `bookmark_user_feed` WHERE userId = ? AND feedId = ?',
          [userId, feedId],
        );
      return { data: affectedRows };
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  // 내가 북마크한 feed 리스트 (paginated)
  async findBookmarkedFeedsByUserId(
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

  // 내가 북마크한 모든 feedIds
  async loadBookmarkedFeedIds(userId: number): Promise<number[]> {
    const rows = await this.bookmarkUserFeedRepository.manager.query(
      'SELECT userId, feedId \
      FROM `bookmark_user_feed` \
      WHERE userId = ?',
      [userId],
    );

    return rows.map((v: BookmarkUserFeed) => v.feedId);
  }

  // 내가 북마크한 feed 여부
  async isBookmarked(userId: number, feedId: number): Promise<AnyData> {
    const [row] = await this.bookmarkUserFeedRepository.manager.query(
      'SELECT COUNT(*) AS count \
      FROM `bookmark_user_feed` \
      WHERE userId = ? AND feedId = ?',
      [userId, feedId],
    );
    const { count } = row;

    return { data: +count };
  }
}
