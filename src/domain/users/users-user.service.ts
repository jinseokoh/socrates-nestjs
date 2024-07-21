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
import { Repository } from 'typeorm/repository/Repository';
import { User } from 'src/domain/users/entities/user.entity';

@Injectable()
export class UsersUserService {
  private readonly env: any;
  private readonly logger = new Logger(UsersUserService.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    @InjectRepository(Hate)
    private readonly hateRepository: Repository<Hate>,
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

  
}
