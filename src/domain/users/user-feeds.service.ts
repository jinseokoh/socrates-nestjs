import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Feed } from 'src/domain/feeds/entities/feed.entity';
import { Repository } from 'typeorm/repository/Repository';
import { Flag } from 'src/domain/users/entities/flag.entity';
import {
  FilterOperator,
  paginate,
  PaginateConfig,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { DataSource } from 'typeorm';
import { BookmarkUserFeed } from 'src/domain/users/entities/bookmark_user_feed.entity';

@Injectable()
export class UserFeedsService {
  private readonly env: any;
  private readonly logger = new Logger(UserFeedsService.name);

  constructor(
    @InjectRepository(Feed)
    private readonly feedRepository: Repository<Feed>,
    @InjectRepository(BookmarkUserFeed)
    private readonly bookmarkUserFeedRepository: Repository<BookmarkUserFeed>,
    @InjectRepository(Flag)
    private readonly flagRepository: Repository<Flag>,
    @Inject(ConfigService) private configService: ConfigService, // global
    private dataSource: DataSource, // for transaction
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //? ----------------------------------------------------------------------- //
  //? My Feeds
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
        BookmarkUserFeed,
        'bookmark_user_feed',
        'bookmark_user_feed.feedId = feed.id',
      )
      .innerJoinAndSelect('feed.user', 'user')
      .where('bookmark_user_feed.userId = :userId', { userId });

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
        BookmarkUserFeed,
        'bookmark_user_feed',
        'bookmark_user_feed.feedId = feed.id',
      )
      .addSelect(['feed.*'])
      .where('bookmark_user_feed.userId = :userId', { userId })
      .getMany();
  }

  // 내가 북마크한 모든 FeedIds
  async loadBookmarkedFeedIds(userId: number): Promise<number[]> {
    const rows = await this.bookmarkUserFeedRepository.manager.query(
      'SELECT feedId FROM `bookmark_user_feed` \
      WHERE bookmark_user_feed.userId = ?',
      [userId],
    );

    return rows.map((v: any) => v.feedId);
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
