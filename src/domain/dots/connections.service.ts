import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { Connection } from 'src/domain/dots/entities/connection.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateConnectionDto } from 'src/domain/dots/dto/create-connection.dto';
import { LoremIpsum } from 'lorem-ipsum';
import { Dot } from 'src/domain/dots/entities/dot.entity';
import { S3Service } from 'src/services/aws/s3.service';
import { UpdateConnectionDto } from 'src/domain/dots/dto/update-connection.dto';
import { randomName } from 'src/helpers/random-filename';
import { SignedUrl } from 'src/common/types';
import { SignedUrlDto } from 'src/domain/users/dto/signed-url.dto';

@Injectable()
export class ConnectionsService {
  private readonly logger = new Logger(ConnectionsService.name);

  constructor(
    @InjectRepository(Connection)
    private readonly repository: Repository<Connection>,
    @InjectRepository(Dot)
    private readonly dotRepository: Repository<Dot>,
    private dataSource: DataSource, // for transaction
    private readonly s3Service: S3Service,
  ) {}

  //?-------------------------------------------------------------------------//
  //? Create
  //?-------------------------------------------------------------------------//

  async create(dto: CreateConnectionDto): Promise<Connection> {
    try {
      const dot = await this.dotRepository.findOne({
        where: {
          id: dto.dotId,
        },
      });
      const connection = await this.repository.findOne({
        where: {
          userId: dto.userId,
          dotId: dto.dotId,
        },
      });
      if (connection) {
        await this.repository.manager.query(
          'INSERT IGNORE INTO `connection` (userId, dotId, choices, answer) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE \
  userId = VALUES(`userId`), \
  dotId = VALUES(`dotId`), \
  choices = VALUES(`choices`), \
  answer = VALUES(`answer`)',
          [dto.userId, dto.dotId, JSON.stringify(dto.choices), dto.answer],
        );
        connection['choices'] = dto.choices;
        connection['answer'] = dto.answer;
        connection['dot'] = dot;

        return connection;
      } else {
        const connection = await this.repository.save(
          this.repository.create(dto),
        );
        connection['dot'] = dot;

        return connection;
      }
    } catch (e) {
      console.log(e);
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
        'sympathyCount',
        'smileCount',
        'surpriseCount',
        'sorryCount',
        'uneasyCount',
      ],
      searchableColumns: ['answer'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        dotId: [FilterOperator.EQ, FilterOperator.IN],
        userId: [FilterOperator.EQ, FilterOperator.IN],
        uneasyCount: [FilterOperator.LT, FilterOperator.GT],
        'user.dob': [FilterOperator.GTE, FilterOperator.LT, FilterOperator.BTW],
        'user.gender': [FilterOperator.EQ],
        // 'dot.slug': [FilterOperator.EQ, FilterOperator.IN],
      },
    });
  }

  // Meetup 상세보기
  async findById(id: number, relations: string[] = []): Promise<Connection> {
    const includedRemarks = relations.includes('remarks');
    try {
      return relations.length > 0
        ? await this.repository.findOneOrFail({
            where: { id },
            relations,
            order: includedRemarks
              ? {
                  remarks: {
                    id: 'DESC',
                  },
                }
              : undefined,
          })
        : await this.repository.findOneOrFail({
            where: { id },
          });
    } catch (e) {
      this.logger.error(e);
      throw new NotFoundException('entity not found');
    }
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  async update(id: number, dto: UpdateConnectionDto): Promise<Connection> {
    const connection = await this.repository.preload({ id, ...dto });
    if (!connection) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(connection);
  }

  //?-------------------------------------------------------------------------//
  //? UPLOAD
  //?-------------------------------------------------------------------------//

  // S3 직접 업로드를 위한 signedUrl 리턴
  async getSignedUrl(userId: number, dto: SignedUrlDto): Promise<SignedUrl> {
    const fileUri = randomName(dto.name ?? 'connection', dto.mimeType);
    const path = `${process.env.NODE_ENV}/connections/${userId}/${fileUri}`;
    const url = await this.s3Service.generateSignedUrl(path);

    return {
      upload: url,
      image: `https://cdn.mesoapp.kr/${path}`,
    };
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
