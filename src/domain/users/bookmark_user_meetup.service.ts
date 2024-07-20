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
import { BookmarkUserMeetup } from 'src/domain/users/entities/bookmark_user_meetup.entity';
import { Repository } from 'typeorm/repository/Repository';

@Injectable()
export class BookmarkUserMeetupService {
  private readonly env: any;
  private readonly logger = new Logger(BookmarkUserMeetupService.name);

  constructor(
    @InjectRepository(BookmarkUserMeetup)
    private readonly bookmarkUserMeetupRepository: Repository<BookmarkUserMeetup>,
    @Inject(ConfigService) private configService: ConfigService, // global
    @Inject(CACHE_MANAGER) private cacheManager: Cache, // global
    private dataSource: DataSource, // for transaction
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //?-------------------------------------------------------------------------//
  //? BookmarkUserMeetup Pivot (차단)
  //?-------------------------------------------------------------------------//

  // 나의 북마크에서 meetup 추가
  async attach(
    userId: number,
    meetupId: number,
    message: string | null,
  ): Promise<AnyData> {
    try {
      const { affectedRows } =
        await this.bookmarkUserMeetupRepository.manager.query(
          'INSERT IGNORE INTO `bookmark_user_meetup` (userId, meetupId, message) VALUES (?, ?, ?) \
  ON DUPLICATE KEY UPDATE \
  userId = VALUES(`userId`), \
  meetupId = VALUES(`meetupId`), \
  message = VALUES(`message`)',
          [userId, meetupId, message],
        );
      return { data: affectedRows };
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  // 나의 북마크에서 meetup 제거
  async detach(userId: number, meetupId: number): Promise<AnyData> {
    try {
      const { affectedRows } =
        await this.bookmarkUserMeetupRepository.manager.query(
          'DELETE FROM `bookmark_user_meetup` WHERE userId = ? AND meetupId = ?',
          [userId, meetupId],
        );
      return { data: affectedRows };
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  // 내가 북마크한 meetup 리스트 (paginated)
  async getMeetupsBookmarkedByMe(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<BookmarkUserMeetup>> {
    const queryBuilder = this.bookmarkUserMeetupRepository
      .createQueryBuilder('bookmark_user_meetup')
      .innerJoinAndSelect('bookmark_user_meetup.meetup', 'meetup')
      .where({
        userId: userId,
      });

    const config: PaginateConfig<BookmarkUserMeetup> = {
      sortableColumns: ['id'],
      searchableColumns: ['message'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'ASC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  // 내가 북마크한 모든 meetupIds
  async getAllIdsBookmarkedByMe(userId: number): Promise<number[]> {
    const rows = await this.bookmarkUserMeetupRepository.manager.query(
      'SELECT userId, meetupId \
      FROM `bookmark_user_meetup` \
      WHERE userId = ?',
      [userId],
    );

    return rows.map((v: BookmarkUserMeetup) => v.meetupId);
  }

  // 내가 북마크한 meetup 여부
  async isBookmarked(userId: number, meetupId: number): Promise<AnyData> {
    const [row] = await this.bookmarkUserMeetupRepository.manager.query(
      'SELECT COUNT(*) AS count \
      FROM `bookmark_user_meetup` \
      WHERE userId = ? AND meetupId = ?',
      [userId, meetupId],
    );
    const { count } = row;

    return { data: +count };
  }
}
