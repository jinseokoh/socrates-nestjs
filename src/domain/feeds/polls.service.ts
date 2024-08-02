import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  PaginateConfig,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { CreatePollDto } from 'src/domain/feeds/dto/create-poll.dto';
import { UpdatePollDto } from 'src/domain/feeds/dto/update-poll.dto';
import { Poll } from 'src/domain/icebreakers/entities/poll.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class PollsService {
  private readonly logger = new Logger(PollsService.name);

  constructor(
    @InjectRepository(Poll)
    private readonly repository: Repository<Poll>,
    private dataSource: DataSource, // for transaction
    private eventEmitter: EventEmitter2,
  ) {}

  //? ----------------------------------------------------------------------- //
  //? Create
  //? ----------------------------------------------------------------------- //

  async create(dto: CreatePollDto): Promise<Poll> {
    try {
      return await this.repository.save(this.repository.create(dto));
    } catch (e) {
      throw new BadRequestException();
    }
  }

  //? ----------------------------------------------------------------------- //
  //? READ
  //? ----------------------------------------------------------------------- //

  async findAll(query: PaginateQuery): Promise<Paginated<Poll>> {
    const config: PaginateConfig<Poll> = {
      relations: ['user', 'factions'],
      sortableColumns: ['id', 'answerCount'],
      searchableColumns: ['question'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        isActive: [FilterOperator.EQ],
        userId: [FilterOperator.EQ, FilterOperator.IN],
        createdAt: [FilterOperator.LT, FilterOperator.GT],
        'factions.id': [FilterOperator.EQ, FilterOperator.IN],
      },
    };

    return await paginate(query, this.repository, config);
  }

  async findById(id: number, relations: string[] = []): Promise<Poll> {
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
      this.logger.error(e);
      throw new NotFoundException('entity not found');
    }
  }

  //? ----------------------------------------------------------------------- //
  //? UPDATE
  //? ----------------------------------------------------------------------- //

  // Poll 갱신
  async update(id: number, dto: UpdatePollDto): Promise<Poll> {
    const poll = await this.repository.preload({ id, ...dto });
    if (!poll) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(poll);
  }
}
