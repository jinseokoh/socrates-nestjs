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
import { Comment } from 'src/domain/feeds/entities/comment.entity';
import { Flag } from 'src/domain/users/entities/flag.entity';
import { Thread } from 'src/domain/meetups/entities/thread.entity';
import { ReportUserUser } from 'src/domain/users/entities/report_user_user.entity';

@Injectable()
export class ReportUserUserService {
  private readonly env: any;
  private readonly logger = new Logger(ReportUserUserService.name);

  constructor(
    @InjectRepository(ReportUserUser)
    private readonly reportUserUserRepository: Repository<ReportUserUser>,
    @Inject(ConfigService) private configService: ConfigService, // global
    @Inject(CACHE_MANAGER) private cacheManager: Cache, // global
    private dataSource: DataSource, // for transaction
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //?-------------------------------------------------------------------------//
  //? ReportUserUser Pivot
  //?-------------------------------------------------------------------------//

  // 나의 북마크에서 user 추가
  async attach(
    userId: number,
    reportedUserId: number,
    message: string | null,
  ): Promise<AnyData> {
    try {
      const { affectedRows } =
        await this.reportUserUserRepository.manager.query(
          'INSERT IGNORE INTO `report_user_user` (userId, reportedUserId, message) VALUES (?, ?, ?) \
    ON DUPLICATE KEY UPDATE \
    userId = VALUES(`userId`), \
    reportedUserId = VALUES(`reportedUserId`), \
    message = VALUES(`message`)',
          [userId, reportedUserId, message],
        );
      return { data: affectedRows };
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  // 나의 북마크에서 user 제거
  async detach(userId: number, reportedUserId: number): Promise<AnyData> {
    try {
      const { affectedRows } =
        await this.reportUserUserRepository.manager.query(
          'DELETE FROM `report_user_user` WHERE userId = ? AND reportedUserId = ?',
          [userId, reportedUserId],
        );
      return { data: affectedRows };
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  // 내가 북마크한 user 리스트 (paginated)
  async getUsersReportedByMe(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<ReportUserUser>> {
    const queryBuilder = this.reportUserUserRepository
      .createQueryBuilder('report_user_user')
      .innerJoinAndSelect('report_user_user.reportedUser', 'reportedUser')
      .where({
        userId: userId,
      });

    const config: PaginateConfig<ReportUserUser> = {
      sortableColumns: ['id'],
      searchableColumns: ['message'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'ASC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  // 내가 북마크한 모든 userIds
  async getAllIdsReportedByMe(userId: number): Promise<number[]> {
    const rows = await this.reportUserUserRepository.manager.query(
      'SELECT userId, reportedUserId \
      FROM `report_user_user` \
      WHERE userId = ?',
      [userId],
    );

    return rows.map((v: ReportUserUser) => v.reportedUserId);
  }

  // 내가 북마크한 user 여부
  async isReported(userId: number, reportedUserId: number): Promise<AnyData> {
    const [row] = await this.reportUserUserRepository.manager.query(
      'SELECT COUNT(*) AS count \
      FROM `report_user_user` \
      WHERE userId = ? AND reportedUserId = ?',
      [userId, reportedUserId],
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
