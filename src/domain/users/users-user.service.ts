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
import { Hate } from 'src/domain/users/entities/hate.entity';
import { ReportUser } from 'src/domain/users/entities/report_user.entity';
import { Repository } from 'typeorm/repository/Repository';
import { User } from 'src/domain/users/entities/user.entity';
import { CreateFlagDto } from 'src/domain/users/dto/create-flag.dto';
import { Remark } from 'src/domain/dots/entities/remark.entity';
import { Thread } from 'src/domain/meetups/entities/thread.entity';

@Injectable()
export class UsersUserService {
  private readonly env: any;
  private readonly logger = new Logger(UsersUserService.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    @InjectRepository(Hate)
    private readonly hateRepository: Repository<Hate>,
    @InjectRepository(ReportUser)
    private readonly reportUserRepository: Repository<ReportUser>,
    @Inject(ConfigService) private configService: ConfigService, // global
    @Inject(CACHE_MANAGER) private cacheManager: Cache, // global
    private dataSource: DataSource, // for transaction
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //?-------------------------------------------------------------------------//
  //? Hate Pivot (차단)
  //?-------------------------------------------------------------------------//

  // 차단한 사용자 리스트에 추가
  async attachUserIdToHatePivot(
    senderId: number,
    recipientId: number,
    message: string,
  ): Promise<void> {
    const { affectedRows } = await this.repository.manager.query(
      'INSERT IGNORE INTO `hate` (senderId, recipientId, message) VALUES (?, ?, ?)',
      [senderId, recipientId, message],
    );
  }

  // 차단한 사용자 리스트에서 삭제
  async detachUserIdFromHatePivot(
    senderId: number,
    recipientId: number,
  ): Promise<void> {
    const { affectedRows } = await this.repository.manager.query(
      'DELETE FROM `hate` WHERE senderId = ? AND recipientId = ?',
      [senderId, recipientId],
    );
  }

  // 내가 차단한 사용자 리스트 (paginated)
  async getUsersHatedByMe(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Hate>> {
    const queryBuilder = this.hateRepository
      .createQueryBuilder('hate')
      .innerJoinAndSelect('hate.recipient', 'user')
      .innerJoinAndSelect('user.profile', 'profile')
      .where({
        senderId: userId,
      });

    const config: PaginateConfig<Hate> = {
      sortableColumns: ['recipientId'],
      searchableColumns: ['message'],
      defaultLimit: 20,
      defaultSortBy: [['recipientId', 'ASC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  // 내가 차단하거나 나를 차단한 사용자ID 리스트 (all)
  async getUserIdsEitherHatingOrBeingHated(userId: number): Promise<AnyData> {
    const rows = await this.repository.manager.query(
      'SELECT senderId, recipientId \
      FROM `hate` \
      WHERE senderId = ? OR recipientId = ?',
      [userId, userId],
    );

    const data = rows.map((v) => {
      return v.senderId === userId ? v.recipientId : v.senderId;
    });

    return { data: [...new Set(data)] };
  }

  //?-------------------------------------------------------------------------//
  //? ReportUser Pivot (신고)
  //?-------------------------------------------------------------------------//

  // 신고한 사용자 리스트에 추가
  async attachUserIdToReportUserPivot(
    userId: number,
    accusedUserId: number,
    message: string | null,
  ): Promise<void> {
    const { affectedRows } = await this.repository.manager.query(
      'INSERT IGNORE INTO `report_user` (userId, accusedUserId, message) VALUES (?, ?, ?)',
      [userId, accusedUserId, message],
    );
  }

  // 신고한 사용자 리스트에서 삭제
  async detachUserIdFromReportUserPivot(
    userId: number,
    accusedUserId: number,
  ): Promise<void> {
    const { affectedRows } = await this.repository.manager.query(
      'DELETE FROM `report_user` WHERE userId = ? AND accusedUserId = ?',
      [userId, accusedUserId],
    );
  }

  // 내가 신고한 사용자 리스트 (paginated)
  async getUsersBeingReportedByMe(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<ReportUser>> {
    const queryBuilder = this.reportUserRepository
      .createQueryBuilder('reportUser')
      .innerJoinAndSelect('reportUser.accusedUser', 'user')
      .innerJoinAndSelect('user.profile', 'profile')
      .where({
        userId: userId,
      });

    const config: PaginateConfig<ReportUser> = {
      sortableColumns: ['userId'],
      searchableColumns: ['message'],
      defaultLimit: 20,
      defaultSortBy: [['accusedUserId', 'ASC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  // 내가 신고한 사용자ID 리스트 (all)
  async getUserIdsBeingReportedByMe(userId: number): Promise<AnyData> {
    const rows = await this.repository.manager.query(
      'SELECT userId, accusedUserId \
      FROM `report` \
      WHERE userId = ?',
      [userId],
    );

    const data = rows.map((v) => {
      return v.userId === userId ? v.accusedUserId : v.userId;
    });

    return { data: [...new Set(data)] };
  }

  //?-------------------------------------------------------------------------//
  //? 댓글 신고
  //?-------------------------------------------------------------------------//

  // 댓글 신고 리스트에 추가
  async createFlag(dto: CreateFlagDto): Promise<Flag> {
    const flag = new Flag({
      message: dto.message,
      entity: dto.entity,
      entityId: dto.entityId,
      userId: dto.userId,
    });

    // additionally, increment flagCount of each
    try {
      const record = await this.dataSource
        .createQueryRunner()
        .manager.save(flag);

      if (dto.entity === 'remark') {
        await this.dataSource
          .getRepository(Remark)
          .increment({ id: dto.entityId }, 'flagCount', 1);
      }
      if (dto.entity === 'thread') {
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
