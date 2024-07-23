import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Feed } from 'src/domain/feeds/entities/feed.entity';
import { Repository } from 'typeorm/repository/Repository';
import { User } from 'src/domain/users/entities/user.entity';
import { Plea } from 'src/domain/pleas/entities/plea.entity';
import { CreatePleaDto } from 'src/domain/pleas/dto/create-plea.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  FilterOperator,
  paginate,
  PaginateConfig,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';

@Injectable()
export class UserFeedsService {
  private readonly env: any;
  private readonly logger = new Logger(UserFeedsService.name);

  constructor(
    @InjectRepository(Feed)
    private readonly feedRepository: Repository<Feed>,
    @InjectRepository(Plea)
    private readonly pleaRepository: Repository<Plea>,
    @Inject(ConfigService) private configService: ConfigService, // global
    private eventEmitter: EventEmitter2,
    private dataSource: DataSource, // for transaction
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //?-------------------------------------------------------------------------//
  //? My Feeds
  //?-------------------------------------------------------------------------//

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

  //! ------------------------------------------------------------------------//
  //! Plea Pivot
  //! ------------------------------------------------------------------------//

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
        recipientId: userId,
      })
      .groupBy('plea.userId')
      .getMany();

    return items.map((v) => v.sender);
  }
}
