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
import { CreateFlagDto } from 'src/domain/users/dto/create-flag.dto';
import { BookmarkUserFeed } from 'src/domain/users/entities/bookmark_user_feed.entity';
import { Flag } from 'src/domain/users/entities/flag.entity';
import { Comment } from 'src/domain/feeds/entities/comment.entity';
import { Thread } from 'src/domain/meetups/entities/thread.entity';

@Injectable()
export class BookmarkUserFeedService {
  private readonly env: any;
  private readonly logger = new Logger(BookmarkUserFeedService.name);

  constructor(
    @InjectRepository(BookmarkUserFeed)
    private readonly bookmarkUserFeedRepository: Repository<BookmarkUserFeed>,
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
  async getFeedsBookmarkedByMe(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<BookmarkUserFeed>> {
    const queryBuilder = this.bookmarkUserFeedRepository
      .createQueryBuilder('bookmark_user_feed')
      .innerJoinAndSelect('bookmark_user_feed.feed', 'feed')
      .where({
        userId: userId,
      });

    const config: PaginateConfig<BookmarkUserFeed> = {
      sortableColumns: ['id'],
      searchableColumns: ['message'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'ASC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  // 내가 북마크한 모든 feedIds
  async getAllIdsBookmarkedByMe(userId: number): Promise<number[]> {
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

  //?-------------------------------------------------------------------------//
  //? 댓글 신고
  //?-------------------------------------------------------------------------//

  // 댓글 신고 리스트에 추가
  async createFlag(dto: CreateFlagDto): Promise<Flag> {
    const flag = new Flag({
      message: dto.message,
      entityType: dto.entityType,
      entityId: dto.entityId,
      userId: dto.userId,
    });

    // additionally, increment flagCount of each
    try {
      const record = await this.dataSource
        .createQueryRunner()
        .manager.save(flag);

      if (dto.entityType === 'comment') {
        await this.dataSource
          .getRepository(Comment)
          .increment({ id: dto.entityId }, 'flagCount', 1);
      }
      if (dto.entityType === 'thread') {
        await this.dataSource
          .getRepository(Thread)
          .increment({ id: dto.entityId }, 'flagCount', 1);
      }

      return record;
    } catch (e) {
      throw e;
    }
  }
}
