import {
  BadRequestException,
  Injectable,
  Logger,
  NotAcceptableException,
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
import { Icebreaker } from 'src/domain/icebreakers/entities/icebreaker.entity';
import { Brackets, DataSource, Repository } from 'typeorm';
import { LoremIpsum } from 'lorem-ipsum';
import { S3Service } from 'src/services/aws/s3.service';
import { randomImageName } from 'src/helpers/random-filename';
import { SignedUrl } from 'src/common/types';
import { SignedUrlDto } from 'src/domain/users/dto/signed-url.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserNotificationEvent } from 'src/domain/users/events/user-notification.event';
import { Question } from 'src/domain/icebreakers/entities/question.entity';
import { CreateIcebreakerDto } from 'src/domain/icebreakers/dto/create-icebreaker.dto';
import { UpdateIcebreakerDto } from 'src/domain/icebreakers/dto/update-icebreaker.dto';
import { User } from 'src/domain/users/entities/user.entity';

@Injectable()
export class IcebreakersService {
  private readonly logger = new Logger(IcebreakersService.name);

  constructor(
    @InjectRepository(Icebreaker)
    private readonly icebreakerRepository: Repository<Icebreaker>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    private eventEmitter: EventEmitter2,
    private readonly s3Service: S3Service,
  ) {}

  //?-------------------------------------------------------------------------//
  //? Create
  //?-------------------------------------------------------------------------//

  async create(dto: CreateIcebreakerDto): Promise<Icebreaker> {
    if (dto.recipientId && dto.userId) {
      const count = await this.icebreakerRepository.count({
        where: {
          recipientId: dto.recipientId,
          userId: dto.userId,
          answerCount: 0,
        },
      });
      if (count > 0) {
        throw new BadRequestException('prerequisite failed');
      }
      const rawQuery = `SELECT COUNT(*) AS count FROM hate WHERE userId = ? AND recipientId = ?`;
      const result = await this.icebreakerRepository.query(rawQuery, [
        dto.recipientId,
        dto.userId,
      ]);
      if (result.length > 0 && parseInt(result[0].count, 10) > 0) {
        throw new BadRequestException('user blocked you');
      }
    }

    return await this.icebreakerRepository.save(
      this.icebreakerRepository.create(dto),
    );
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//
  async findAll(query: PaginateQuery): Promise<Paginated<Icebreaker>> {
    //! filterableColumns 의 key 값이 아닌 경우 무시하기 때문에, queryFilter 이 아닌 id, gender, age 전달용으로 사용.
    const queryBuilder =
      query.filter.id && query.filter.gender && query.filter.age
        ? this.icebreakerRepository
            .createQueryBuilder('icebreaker') // 필수정보 입력 사용자의 경우,
            .where('icebreaker.recipientId = :id', { id: query.filter.id })
            .orWhere(
              new Brackets((qb) => {
                qb.where('icebreaker.recipientId IS NULL')
                  .andWhere(
                    new Brackets((qb2) => {
                      qb2
                        .where('icebreaker.targetGender = :gender', {
                          gender: query.filter.gender,
                        })
                        .orWhere('icebreaker.targetGender = :all', {
                          all: 'all',
                        });
                    }),
                  )
                  .andWhere('icebreaker.targetMinAge <= :age', {
                    age: query.filter.age,
                  })
                  .andWhere('icebreaker.targetMaxAge >= :age', {
                    age: query.filter.age,
                  })
                  .andWhere('icebreaker.userId <> :userId', {
                    userId: query.filter.id,
                  });
              }),
            )
        : this.icebreakerRepository
            .createQueryBuilder('icebreaker') // 필수정보 미입력 사용자의 경우,
            .where('icebreaker.recipientId = :id', { id: query.filter.id })
            .orWhere(
              new Brackets((qb) => {
                qb.where('icebreaker.recipientId IS NULL')
                  .andWhere('icebreaker.targetMinAge = :age', { age: 18 })
                  .andWhere('icebreaker.targetMaxAge = :age', { age: 66 })
                  .andWhere('icebreaker.userId <> :userId', {
                    userId: query.filter.id,
                  });
              }),
            );

    const config: PaginateConfig<Icebreaker> = {
      relations: {
        user: { profile: true },
      },
      sortableColumns: ['id'],
      searchableColumns: ['body'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        userId: [FilterOperator.EQ, FilterOperator.IN],
        recipientId: [FilterOperator.EQ, FilterOperator.IN],
        targetGender: [FilterOperator.EQ],
        targetMinAge: [FilterOperator.LTE],
        targetMaxAge: [FilterOperator.GTE],
        // 'icebreaker.slug': [FilterOperator.EQ, FilterOperator.IN],
      },
    };
    return await paginate(query, queryBuilder, config);
  }

  // Icebreaker 상세보기
  async findById(id: number, relations: string[] = []): Promise<Icebreaker> {
    // const icebreakerAnswers = relations.includes('icebreakerAnswers');
    try {
      return relations.length > 0
        ? await this.icebreakerRepository.findOneOrFail({
            where: { id },
            relations,
            //! todo fix this!
            // order: icebreakerComments
            //   ? {
            //       icebreakerComments: {
            //         id: 'DESC',
            //       },
            //     }
            //   : undefined,
          })
        : await this.icebreakerRepository.findOneOrFail({
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

  async update(id: number, dto: UpdateIcebreakerDto): Promise<Icebreaker> {
    const icebreaker = await this.icebreakerRepository.preload({ id, ...dto });
    if (!icebreaker) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.icebreakerRepository.save(icebreaker);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  async softRemove(id: number): Promise<Icebreaker> {
    const icebreaker = await this.findById(id);
    return await this.icebreakerRepository.softRemove(icebreaker);
  }

  //?-------------------------------------------------------------------------//
  //? UPLOAD
  //?-------------------------------------------------------------------------//

  // S3 직접 업로드를 위한 signedUrl 리턴
  async getSignedUrl(userId: number, dto: SignedUrlDto): Promise<SignedUrl> {
    const fileUri = randomImageName(dto.name ?? 'icebreaker', dto.mimeType);
    const path = `${process.env.NODE_ENV}/icebreakers/${userId}/${fileUri}`;
    const url = await this.s3Service.generateSignedUrl(path);

    return {
      upload: url,
      image: `https://cdn.mesoapp.kr/${path}`,
    };
  }
}
