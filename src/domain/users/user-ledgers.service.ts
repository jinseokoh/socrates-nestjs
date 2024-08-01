import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  PaginateConfig,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { ConfigService } from '@nestjs/config';
import { Ledger } from 'src/domain/ledgers/entities/ledger.entity';
import { Repository } from 'typeorm/repository/Repository';

@Injectable()
export class UserLedgersService {
  private readonly env: any;
  private readonly logger = new Logger(UserLedgersService.name);

  constructor(
    @InjectRepository(Ledger)
    private readonly ledgerRepository: Repository<Ledger>,
    @Inject(ConfigService) private configService: ConfigService, // global
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //? ----------------------------------------------------------------------- //
  //? Ledgers
  //? ----------------------------------------------------------------------- //

  async list(userId: number, query: PaginateQuery): Promise<Paginated<Ledger>> {
    const queryBuilder = this.ledgerRepository
      .createQueryBuilder('ledger')
      .innerJoinAndSelect('ledger.user', 'user')
      .innerJoinAndSelect('user.profile', 'profile')
      .where({
        userId,
      });

    const config: PaginateConfig<Ledger> = {
      sortableColumns: ['id'],
      searchableColumns: ['ledgerType'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        ledgerType: [FilterOperator.EQ, FilterOperator.IN],
      },
    };

    return await paginate(query, queryBuilder, config);
  }
}
