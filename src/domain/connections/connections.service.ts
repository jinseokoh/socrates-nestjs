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
import { Connection } from 'src/domain/connections/entities/connection.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateConnectionDto } from 'src/domain/connections/dto/create-connection.dto';
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

  async create(dto: CreateConnectionDto): Promise<Connection> {
    try {
      const entity = await this.repository.save(this.repository.create(dto));
      return await this.findById(entity.id, ['dot']);
    } catch (e) {
      throw new BadRequestException();
    }
  }

  //?-------------------------------------------------------------------------//
  //? Upsert
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'create connection! not dot.' })
  async upsert(dto: CreateConnectionDto): Promise<void> {
    try {
      await this.repository.upsert(
        [
          {
            userId: dto.userId,
            dotId: dto.dotId,
            answer: dto.answer,
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
  async findAll(query: PaginateQuery): Promise<Paginated<Connection>> {
    return await paginate(query, this.repository, {
      relations: ['user', 'user.profile', 'dot', 'remarks', 'remarks.user'],
      sortableColumns: [
        'id',
        'sympatheticCount',
        'humorousCount',
        'surprisedCount',
        'sadCount',
        'disgustCount',
      ],
      searchableColumns: ['answer'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        dotId: [FilterOperator.EQ, FilterOperator.IN],
        userId: [FilterOperator.EQ, FilterOperator.IN],
        'user.dob': [FilterOperator.GTE, FilterOperator.LT, FilterOperator.BTW],
        'user.gender': [FilterOperator.EQ],
        // 'dot.slug': [FilterOperator.EQ, FilterOperator.IN],
      },
    });
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
      this.logger.error(e);
      throw new NotFoundException('entity not found');
    }
  }

  // Meetup 상세보기
  async findByUserId(id: number): Promise<Connection[]> {
    try {
      return (
        this.repository
          .createQueryBuilder('connection')
          .leftJoinAndSelect('connection.dot', 'dot')
          // .leftJoinAndSelect('connection.user', 'author')
          .leftJoinAndSelect('connection.remarks', 'remark')
          .leftJoinAndSelect('remark.user', 'user')
          .where({
            userId: id,
          })
          .getMany()
      );
    } catch (e) {
      this.logger.error(e);
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

    await Promise.all(
      [...Array(240).keys()].map(async (v: number) => {
        const dotId = (v % 120) + 1;
        const userId = randomInt(1, 20);
        const answer = lorem.generateSentences(5);

        const dto = new CreateConnectionDto();
        dto.dotId = dotId;
        dto.userId = userId;
        dto.answer = answer;
        await this.repository.save(this.repository.create(dto));
      }),
    );
  }
}
