import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  paginate,
  PaginateConfig,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { Icebreaker } from 'src/domain/icebreakers/entities/icebreaker.entity';
import { IcebreakerAnswer } from 'src/domain/icebreakers/entities/icebreaker_answer.entity';
import { UserNotificationEvent } from 'src/domain/users/events/user-notification.event';
import { randomImageName } from 'src/helpers/random-filename';
import { DataSource, IsNull, Repository } from 'typeorm';
import { SignedUrl } from 'src/common/types';
import { SignedUrlDto } from 'src/domain/users/dto/signed-url.dto';
import { CreateIcebreakerAnswerDto } from 'src/domain/icebreakers/dto/create-icebreaker_answer.dto';
import { UpdateIcebreakerAnswerDto } from 'src/domain/icebreakers/dto/update-icebreaker_answer.dto';
import { S3Service } from 'src/services/aws/s3.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { truncate } from 'src/helpers/truncate';

@Injectable()
export class IcebreakerAnswersService {
  private readonly logger = new Logger(IcebreakerAnswersService.name);

  constructor(
    @InjectRepository(Icebreaker)
    private readonly icebreakerRepository: Repository<Icebreaker>,
    @InjectRepository(IcebreakerAnswer)
    private readonly icebreakerAnswerRepository: Repository<IcebreakerAnswer>,
    private readonly s3Service: S3Service,
    private eventEmitter: EventEmitter2,
    private dataSource: DataSource, // for transaction
  ) {}

  //? ----------------------------------------------------------------------- //
  //? 아이스브레이커 답변 생성
  //? ----------------------------------------------------------------------- //

  async create(dto: CreateIcebreakerAnswerDto): Promise<IcebreakerAnswer> {
    // creation
    const answer = await this.icebreakerAnswerRepository.save(
      this.icebreakerAnswerRepository.create(dto),
    );
    if (dto.sendNotification) {
      //? notify with event listener
      const record = await this.findById(answer.id, [
        'user',
        'icebreaker',
        'icebreaker.user',
        'icebreaker.user.profile',
      ]);

      if (record.icebreaker.user.id != dto.userId) {
        const event = new UserNotificationEvent();
        event.name = 'icebreaker';
        event.userId = record.icebreaker.user.id;
        event.token = record.icebreaker.user.pushToken;
        event.options = record.icebreaker.user.profile?.options ?? {};
        event.body = `${truncate(record.icebreaker.body, 9)} 질문에 새로운 댓글이 있습니다.`;
        event.data = {
          page: `icebreakers/${dto.icebreakerId}`,
        };
        this.eventEmitter.emit('user.notified', event);
      }
    }

    this.icebreakerRepository.increment(
      { id: dto.icebreakerId },
      `answerCount`,
      1,
    );

    return answer;
  }

  //? ----------------------------------------------------------------------- //
  //? 아이스브레이커 답변 리스트
  //? ----------------------------------------------------------------------- //

  //? 댓글 리스트 w/ Pagination (children)
  async findAll(query: PaginateQuery): Promise<Paginated<IcebreakerAnswer>> {
    return paginate(
      query,
      this.icebreakerAnswerRepository.createQueryBuilder('icebreakerAnswer'),
      {
        relations: ['icebreaker', 'user'],
        sortableColumns: ['id'],
        searchableColumns: ['body'],
        defaultLimit: 20,
        defaultSortBy: [['id', 'DESC']],
        filterableColumns: {
          icebreakerId: [FilterOperator.EQ, FilterOperator.IN],
          userId: [FilterOperator.EQ, FilterOperator.IN],
          flagCount: [FilterOperator.GTE, FilterOperator.GT],
          'user.dob': [
            FilterOperator.GTE,
            FilterOperator.LT,
            FilterOperator.BTW,
          ],
          'user.gender': [FilterOperator.EQ],
          // 'poll.slug': [FilterOperator.EQ, FilterOperator.IN],
        },
      },
    );
  }

  //? 아이스브레이커 답변 리스트 w/ Pagination
  async findAllInYoutubeStyle(
    query: PaginateQuery,
    icebreakerId: number,
  ): Promise<Paginated<IcebreakerAnswer>> {
    const queryBuilder = this.icebreakerAnswerRepository
      .createQueryBuilder('answer')
      .innerJoinAndSelect('answer.user', 'user')
      .loadRelationCountAndMap('answer.replyCount', 'answer.children')
      .where('answer.parentId IS NULL')
      .andWhere('answer.icebreakerId = :icebreakerId', { icebreakerId });

    const config: PaginateConfig<IcebreakerAnswer> = {
      sortableColumns: ['id'],
      searchableColumns: ['body'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        icebreakerId: [FilterOperator.EQ],
        isFlagged: [FilterOperator.EQ],
      },
    };

    return await paginate<IcebreakerAnswer>(query, queryBuilder, config);
  }

  //? 아이스브레이커 답변 리스트, 최상단 부모는 리턴되지 않음.
  async findAllRepliesById(
    query: PaginateQuery,
    icebreakerId: number,
    answerId: number,
  ): Promise<Paginated<IcebreakerAnswer>> {
    const queryBuilder = this.icebreakerAnswerRepository
      .createQueryBuilder('answer')
      .innerJoinAndSelect('answer.user', 'user')
      .where('answer.icebreakerId = :icebreakerId', { icebreakerId })
      .andWhere('answer.parentId = :answerId', { answerId })
      .andWhere('answer.deletedAt IS NULL');

    const config: PaginateConfig<IcebreakerAnswer> = {
      sortableColumns: ['id'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'ASC']],
      filterableColumns: {
        isFlagged: [FilterOperator.EQ],
      },
    };

    return await paginate<IcebreakerAnswer>(query, queryBuilder, config);
  }

  // required when checking if the answer exists
  async findById(
    id: number,
    relations: string[] = [],
  ): Promise<IcebreakerAnswer> {
    try {
      return relations.length > 0
        ? await this.icebreakerAnswerRepository.findOneOrFail({
            where: { id },
            relations,
          })
        : await this.icebreakerAnswerRepository.findOneOrFail({
            where: { id },
          });
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }

  // reserved. no use cases as of yet.
  async count(body: string): Promise<number> {
    return await this.icebreakerAnswerRepository.countBy({
      body: body,
    });
  }

  //? ----------------------------------------------------------------------- //
  //? 아이스브레이커 답변 update
  //? ----------------------------------------------------------------------- //

  async update(
    answerId: number,
    dto: UpdateIcebreakerAnswerDto,
  ): Promise<IcebreakerAnswer> {
    const answer = await this.icebreakerAnswerRepository.preload({
      id: answerId,
      ...dto,
    });
    // user validation here might be a good option to be added
    if (!answer) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.icebreakerAnswerRepository.save(answer);
  }

  //? ----------------------------------------------------------------------- //
  //? 아이스브레이커 답변 delete
  //? ----------------------------------------------------------------------- //

  async softRemove(id: number): Promise<IcebreakerAnswer> {
    try {
      const answer = await this.findById(id);
      await this.icebreakerAnswerRepository.softRemove(answer);
      await this.icebreakerRepository.manager.query(
        `UPDATE icebreaker SET answerCount = answerCount - 1 WHERE id = ? AND answerCount > 0`,
        [answer.icebreakerId],
      );
      return answer;
    } catch (e) {
      this.logger.log(e);
      throw e;
    }
  }

  //! not being used.
  async remove(id: number): Promise<IcebreakerAnswer> {
    const answer = await this.findById(id);
    return await this.icebreakerAnswerRepository.remove(answer);
  }

  //? ----------------------------------------------------------------------- //
  //? Upload
  //? ----------------------------------------------------------------------- //

  // S3 직접 업로드를 위한 signedUrl 리턴
  async getSignedUrl(
    userId: number,
    icebreakerId: number,
    dto: SignedUrlDto,
  ): Promise<SignedUrl> {
    const fileUri = randomImageName(
      dto.name ?? `icebreaker_${icebreakerId}_answer`,
      dto.mimeType,
    );
    const path = `${process.env.NODE_ENV}/icebreaker_answers/${userId}/${fileUri}`;
    const url = await this.s3Service.generateSignedUrl(path);

    return {
      upload: url,
      image: `https://cdn.mesoapp.kr/${path}`,
    };
  }
}
