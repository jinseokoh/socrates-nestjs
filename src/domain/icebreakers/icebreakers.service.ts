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
import { Icebreaker } from 'src/domain/icebreakers/entities/icebreaker.entity';
import { DataSource, Repository } from 'typeorm';
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
    try {
      return await this.icebreakerRepository.save(
        this.icebreakerRepository.create(dto),
      );
    } catch (e) {
      console.log(e);
      throw new BadRequestException();
    }
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//
  async findAll(query: PaginateQuery): Promise<Paginated<Icebreaker>> {
    return await paginate(query, this.icebreakerRepository, {
      relations: ['user'],
      sortableColumns: ['id'],
      searchableColumns: ['body'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        userId: [FilterOperator.EQ, FilterOperator.IN],
        recipientId: [FilterOperator.EQ, FilterOperator.IN],
        uneasyCount: [FilterOperator.LT, FilterOperator.GT],
        targetGender: [FilterOperator.EQ],
        targetMinAge: [FilterOperator.LTE],
        targetMaxAge: [FilterOperator.GTE],
        // 'icebreaker.slug': [FilterOperator.EQ, FilterOperator.IN],
      },
    });
  }

  // Meetup 상세보기
  async findById(id: number, relations: string[] = []): Promise<Icebreaker> {
    const icebreakerComments = relations.includes('icebreakerComments');
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

  //?-------------------------------------------------------------------------//
  //? SEED
  //?-------------------------------------------------------------------------//

  async seedIcebreakers(): Promise<void> {
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
        const questionId = (v % 120) + 1;
        const userId = randomInt(1, 20);
        const body = lorem.generateSentences(5);

        const dto = new CreateIcebreakerDto();
        dto.questionId = questionId;
        dto.userId = userId;
        dto.body = body;
        await this.icebreakerRepository.save(
          this.icebreakerRepository.create(dto),
        );
      }),
    );
  }
}
