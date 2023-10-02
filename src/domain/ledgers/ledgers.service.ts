import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  PaginateConfig,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { REDIS_PUBSUB_CLIENT } from 'src/common/constants';
import { Ledger } from 'src/domain/ledgers/entities/ledger.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { CreateLedgerDto } from 'src/domain/ledgers/dto/create-ledger.dto';
import { UpdateLedgerDto } from 'src/domain/ledgers/dto/update-ledger.dto';
import { Repository } from 'typeorm/repository/Repository';
@Injectable()
export class LedgersService {
  private readonly logger = new Logger(LedgersService.name);

  constructor(
    @Inject(REDIS_PUBSUB_CLIENT) private readonly redisClient: ClientProxy,
    @InjectRepository(Ledger)
    private readonly repository: Repository<Ledger>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  // Ledger 생성
  async create(dto: CreateLedgerDto): Promise<Ledger> {
    // const user = await this.userRepository.findOne({
    //   where: { id: dto.userId },
    // });
    // if (!user || user?.isBanned) {
    //   throw new BadRequestException(`not allowed to create`);
    // }

    return await this.repository.save(this.repository.create(dto));
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  // Ledger 리스트 w/ Pagination
  async findAll(query: PaginateQuery): Promise<Paginated<Ledger>> {
    const queryBuilder = this.repository
      .createQueryBuilder('ledger')
      .leftJoinAndSelect('ledger.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile');

    const config: PaginateConfig<Ledger> = {
      relations: {
        user: { profile: true },
      },
      sortableColumns: ['id'],
      searchableColumns: ['note'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        userId: [FilterOperator.EQ, FilterOperator.IN],
        createdAt: [FilterOperator.GTE, FilterOperator.LT],
      },
    };

    return await paginate(query, queryBuilder, config);
  }

  // Ledger 상세보기
  async findById(id: number, relations: string[] = []): Promise<Ledger> {
    try {
      return relations.length > 0
        ? await this.repository.findOneOrFail({
            where: { id },
            relations,
          })
        : await this.repository.findOneOrFail({
            where: { id },
          });
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  async update(id: number, dto: UpdateLedgerDto): Promise<Ledger> {
    const ledger = await this.repository.preload({ id, ...dto });
    if (!ledger) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(ledger);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  async softRemove(id: number): Promise<Ledger> {
    const Ledger = await this.findById(id);
    return await this.repository.softRemove(Ledger);
  }

  async remove(id: number): Promise<Ledger> {
    const Ledger = await this.findById(id);
    return await this.repository.remove(Ledger);
  }

}
