import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  PaginateConfig,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { Emotion } from 'src/common/enums';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Feed } from 'src/domain/feeds/entities/feed.entity';
import { ReportUserFeed } from 'src/domain/users/entities/report_user_feed.entity';
import { Repository } from 'typeorm/repository/Repository';
import { User } from 'src/domain/users/entities/user.entity';
import { Plea } from 'src/domain/pleas/entities/plea.entity';
import { CreatePleaDto } from 'src/domain/pleas/dto/create-plea.dto';
import { UserNotificationEvent } from 'src/domain/users/events/user-notification.event';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UpsertBookmarkDto } from 'src/domain/users/dto/upsert-bookmark.dto';
import { BookmarkUserFeed } from 'src/domain/users/entities/bookmark_user_feed.entity';

@Injectable()
export class UsersFeedService {
  private readonly env: any;
  private readonly logger = new Logger(UsersFeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    @InjectRepository(Feed)
    private readonly feedRepository: Repository<Feed>,
    @InjectRepository(BookmarkUserFeed)
    private readonly bookmarkUserFeedRepository: Repository<BookmarkUserFeed>,
    @InjectRepository(Plea)
    private readonly pleaRepository: Repository<Plea>,
    @InjectRepository(ReportUserFeed)
    private readonly reportFeedRepository: Repository<ReportUserFeed>,
    @Inject(ConfigService) private configService: ConfigService, // global
    private eventEmitter: EventEmitter2,
    private dataSource: DataSource, // for transaction
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //?-------------------------------------------------------------------------//
  //? Feeds
  //?-------------------------------------------------------------------------//

  // 내가 만든 발견 리스트 (paginated)
  async listMyFeeds(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Feed>> {
    const queryBuilder = this.feedRepository
      .createQueryBuilder('feed')
      .innerJoinAndSelect('feed.poll', 'poll')
      .innerJoinAndSelect('feed.user', 'user')
      .leftJoinAndSelect('feed.comments', 'comments')
      .where({
        userId,
      });

    const config: PaginateConfig<Feed> = {
      sortableColumns: ['createdAt'],
      searchableColumns: ['body'],
      defaultLimit: 20,
      defaultSortBy: [['createdAt', 'DESC']],
      filterableColumns: {
        region: [FilterOperator.EQ, FilterOperator.IN],
        category: [FilterOperator.EQ, FilterOperator.IN],
        subCategory: [FilterOperator.EQ, FilterOperator.IN],
        targetGender: [FilterOperator.EQ, FilterOperator.IN],
        expiredAt: [FilterOperator.GTE, FilterOperator.LT],
      },
    };

    return await paginate(query, queryBuilder, config);
  }

  // 이 회원의 Feed 리스트 전부 보기
  async loadMyFeeds(userId: number): Promise<Feed[]> {
    try {
      return this.feedRepository
        .createQueryBuilder('feed')
        .leftJoinAndSelect('feed.poll', 'poll')
        .leftJoinAndSelect('feed.user', 'author')
        .leftJoinAndSelect('feed.comments', 'comment')
        .leftJoinAndSelect('comment.user', 'user')
        .where({
          userId,
        })
        .getMany();
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }

  //?-------------------------------------------------------------------------//
  //? ReportUserFeed Pivot
  //?-------------------------------------------------------------------------//

  // 차단한 발견 리스트에 추가
  async attachToReportUserFeedPivot(
    userId: number,
    feedId: number,
    message: string,
  ): Promise<void> {
    const { affectedRows } = await this.repository.manager.query(
      'INSERT IGNORE INTO `user_feed_report` (userId, feedId, message) VALUES (?, ?, ?)',
      [userId, feedId, message],
    );
    if (affectedRows > 0) {
      await this.feedRepository.increment({ id: feedId }, 'reportCount', 1);
    }
  }

  // 차단한 발견 리스트에서 삭제
  async detachFromReportUserFeedPivot(
    userId: number,
    feedId: number,
  ): Promise<void> {
    const { affectedRows } = await this.repository.manager.query(
      'DELETE FROM `user_feed_report` WHERE userId = ? AND feedId = ?',
      [userId, feedId],
    );
    if (affectedRows > 0) {
      // await this.feedRrepository.decrement({ feedId }, 'ReportUserFeedCount', 1);
      await this.repository.manager.query(
        'UPDATE `feed` SET reportCount = reportCount - 1 WHERE id = ? AND reportCount > 0',
        [feedId],
      );
    }
  }

  // 내가 차단한 발견 리스트 (paginated)
  async getFeedsReportedByMe(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<ReportUserFeed>> {
    const queryBuilder = this.reportFeedRepository
      .createQueryBuilder('user_feed_report')
      .leftJoinAndSelect('user_feed_report.feed', 'feed')
      .leftJoinAndSelect('feed.poll', 'poll')
      .where({
        userId,
      });

    const config: PaginateConfig<ReportUserFeed> = {
      sortableColumns: ['feedId'],
      searchableColumns: ['feed.body'],
      defaultLimit: 20,
      defaultSortBy: [['feedId', 'DESC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  // 내가 차단한 발견ID 리스트 (all)
  async getFeedIdsReportedByMe(userId: number): Promise<number[]> {
    const items = await this.repository.manager.query(
      'SELECT feedId \
      FROM `user` INNER JOIN `user_feed_report` \
      ON `user`.id = `user_feed_report`.userId \
      WHERE `user`.id = ?',
      [userId],
    );

    return items.map(({ feedId }) => feedId);
  }

  //?-------------------------------------------------------------------------//
  //?  Reaction Pivot
  //?-------------------------------------------------------------------------//

  async upsertBookmark(dto: UpsertBookmarkDto): Promise<void> {
    // upsert bookmark
    try {
      await this.repository.manager.query(
        `INSERT IGNORE INTO bookmark (userId, feedId) VALUES (?, ?)`,
        [dto.userId, dto.feedId],
      );
    } catch (e) {
      this.logger.log(e);
    }
  }

  // // 내가 반응한 발견 리스트 (paginated)
  // async getFeedsBookmarkedByMe(
  //   userId: number,
  //   query: PaginateQuery,
  // ): Promise<Paginated<BookmarkUserFeed>> {
  //   const queryBuilder = this.bookmarkRepository
  //     .createQueryBuilder('bookmark')
  //     .innerJoinAndSelect('bookmark.feed', 'feed')
  //     .innerJoinAndSelect('feed.poll', 'poll')
  //     .innerJoinAndSelect('feed.user', 'user')
  //     .leftJoinAndSelect('feed.bookmarkedByUsers', 'bookmarkedByUsers')
  //     .where({
  //       userId,
  //     });

  //   const config: PaginateConfig<BookmarkUserFeed> = {
  //     sortableColumns: ['id'],
  //     defaultLimit: 20,
  //     defaultSortBy: [['id', 'DESC']],
  //     filterableColumns: {},
  //   };

  //   return await paginate(query, queryBuilder, config);
  // }

  //?-------------------------------------------------------------------------//
  //? Plea Pivot
  //?-------------------------------------------------------------------------//

  // 발견요청 리스트에 추가
  async attachToPleaPivot(dto: CreatePleaDto): Promise<Plea> {
    const plea = await this.pleaRepository.save(
      this.pleaRepository.create(dto),
    );

    return plea;
  }

  async getUniqueUsersPleaded(userId: number): Promise<User[]> {
    const items = await this.pleaRepository
      .createQueryBuilder('plea')
      .innerJoinAndSelect('plea.sender', 'sender')
      .where({
        askedUserId: userId,
      })
      .groupBy('plea.senderId')
      .getMany();

    return items.map((v) => v.sender);
  }
}
