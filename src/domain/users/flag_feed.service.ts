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
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm/repository/Repository';
import { Flag } from 'src/domain/users/entities/flag.entity';
import { Feed } from 'src/domain/feeds/entities/feed.entity';
import { User } from 'src/domain/users/entities/user.entity';

@Injectable()
export class FlagFeedService {
  private readonly env: any;
  private readonly logger = new Logger(FlagFeedService.name);

  constructor(
    @InjectRepository(Flag)
    private readonly flagRepository: Repository<Flag>,
    @InjectRepository(Feed)
    private readonly feedRepository: Repository<Feed>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(ConfigService) private configService: ConfigService, // global
    private dataSource: DataSource, // for transaction
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //? ----------------------------------------------------------------------- //
  //? Feed
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
      searchableColumns: ['body'],
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
