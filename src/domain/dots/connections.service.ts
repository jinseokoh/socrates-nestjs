import { ApiOperation } from '@nestjs/swagger';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  PaginateConfig,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { Connection } from 'src/domain/users/entities/connection.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateConnectionDto } from 'src/domain/dots/dto/create-connection.dto';
import { LoremIpsum } from 'lorem-ipsum';

@Injectable()
export class ConnectionsService {
  private readonly logger = new Logger(ConnectionsService.name);

  constructor(
    @InjectRepository(Connection)
    private readonly repository: Repository<Connection>,
    private dataSource: DataSource, // for transaction
  ) {}

  //?-------------------------------------------------------------------------//
  //? Create
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'create connection! not dot.' })
  async create(dto: CreateConnectionDto): Promise<void> {
    try {
      await this.repository.upsert(
        [
          {
            userId: dto.userId,
            dotId: dto.dotId,
            body: dto.body,
          },
        ],
        ['userId', 'dotId'],
      );
    } catch (e) {
      throw new BadRequestException();
    }
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  // Connection 리스트 w/ Pagination
  // filtering example)
  // - /v1/dots/connections?filter.user.gender=male
  // - /v1/dots/connections?filter.user.dob=$btw:1990-01-01,2010-01-01
  async findAll(query: PaginateQuery): Promise<Paginated<Connection>> {
    const queryBuilder = this.repository
      .createQueryBuilder('connection')
      .leftJoinAndSelect('connection.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('connection.dot', 'dot');

    const config: PaginateConfig<Connection> = {
      relations: {
        user: { profile: true },
        // dot: true, // not being used at least for now.
      },
      sortableColumns: ['id'],
      searchableColumns: ['body'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        dotId: [FilterOperator.EQ, FilterOperator.IN],
        userId: [FilterOperator.EQ, FilterOperator.IN],
        'user.dob': [FilterOperator.GTE, FilterOperator.LT, FilterOperator.BTW],
        'user.gender': [FilterOperator.EQ],
        // 'dot.slug': [FilterOperator.EQ, FilterOperator.IN],
      },
    };

    return await paginate(query, queryBuilder, config);
  }

  // Meetup 상세보기
  async findById(id: number, relations: string[] = []): Promise<Connection> {
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
  //? SEED
  //?-------------------------------------------------------------------------//

  async seedConnections(): Promise<void> {
    const lorem = new LoremIpsum({
      sentencesPerParagraph: {
        max: 8,
        min: 4,
      },
      wordsPerSentence: {
        max: 16,
        min: 4,
      },
    });
    const randomInt = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1) + min);

    Promise.all(
      [...Array(240).keys()].map(async (v: number) => {
        const dotId = (v % 120) + 1;
        const userId = randomInt(1, 20);
        const body = lorem.generateSentences(5);

        const dto = new CreateConnectionDto();
        dto.dotId = dotId;
        dto.userId = userId;
        dto.body = body;
        this.repository.create(dto);
      }),
    );
  }
}
