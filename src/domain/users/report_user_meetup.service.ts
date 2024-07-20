import { Flag } from 'src/domain/users/entities/flag.entity';
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
import { ReportUserMeetup } from 'src/domain/users/entities/report_user_meetup.entity';
import { Repository } from 'typeorm/repository/Repository';
import { CreateFlagDto } from 'src/domain/users/dto/create-flag.dto';
import { Comment } from 'src/domain/feeds/entities/comment.entity';
import { Thread } from 'src/domain/meetups/entities/thread.entity';

@Injectable()
export class ReportUserMeetupService {
  private readonly env: any;
  private readonly logger = new Logger(ReportUserMeetupService.name);

  constructor(
    @InjectRepository(ReportUserMeetup)
    private readonly reportUserMeetupRepository: Repository<ReportUserMeetup>,
    @Inject(ConfigService) private configService: ConfigService, // global
    @Inject(CACHE_MANAGER) private cacheManager: Cache, // global
    private dataSource: DataSource, // for transaction
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //?-------------------------------------------------------------------------//
  //? ReportUserMeetup Pivot (차단)
  //?-------------------------------------------------------------------------//

  // 나의 북마크에서 meetup 추가
  async attach(
    userId: number,
    meetupId: number,
    message: string | null,
  ): Promise<AnyData> {
    try {
      const { affectedRows } =
        await this.reportUserMeetupRepository.manager.query(
          'INSERT IGNORE INTO `report_user_meetup` (userId, meetupId, message) VALUES (?, ?, ?) \
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
        await this.reportUserMeetupRepository.manager.query(
          'DELETE FROM `report_user_meetup` WHERE userId = ? AND meetupId = ?',
          [userId, meetupId],
        );
      return { data: affectedRows };
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  // 내가 북마크한 meetup 리스트 (paginated)
  async getMeetupsReportedByMe(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<ReportUserMeetup>> {
    const queryBuilder = this.reportUserMeetupRepository
      .createQueryBuilder('report_user_meetup')
      .innerJoinAndSelect('report_user_meetup.meetup', 'meetup')
      .where({
        userId: userId,
      });

    const config: PaginateConfig<ReportUserMeetup> = {
      sortableColumns: ['id'],
      searchableColumns: ['message'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'ASC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  // 내가 북마크한 모든 meetupIds
  async getAllIdsReportedByMe(userId: number): Promise<number[]> {
    const rows = await this.reportUserMeetupRepository.manager.query(
      'SELECT userId, meetupId \
      FROM `report_user_meetup` \
      WHERE userId = ?',
      [userId],
    );

    return rows.map((v: ReportUserMeetup) => v.meetupId);
  }

  // 내가 북마크한 meetup 여부
  async isReported(userId: number, meetupId: number): Promise<AnyData> {
    const [row] = await this.reportUserMeetupRepository.manager.query(
      'SELECT COUNT(*) AS count \
      FROM `report_user_meetup` \
      WHERE userId = ? AND meetupId = ?',
      [userId, meetupId],
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
