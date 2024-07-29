import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  PaginateConfig,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { CreateAnswerCommentDto } from 'src/domain/icebreakers/dto/create-answer_comment.dto';

import { Answer } from 'src/domain/icebreakers/entities/answer.entity';
import { AnswerComment } from 'src/domain/icebreakers/entities/answer_comment.entity';
import { FindOneOptions, Repository } from 'typeorm';
import { REDIS_PUBSUB_CLIENT } from 'src/common/constants';
import { ClientProxy } from '@nestjs/microservices';

import { UserNotificationEvent } from 'src/domain/users/events/user-notification.event';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AnswerCommentsService {
  private readonly logger = new Logger(AnswerCommentsService.name);

  constructor(
    @InjectRepository(AnswerComment)
    private readonly repository: Repository<AnswerComment>,
    @InjectRepository(Answer)
    private readonly answerRepository: Repository<Answer>,
    @Inject(REDIS_PUBSUB_CLIENT) private readonly redisClient: ClientProxy,
    // @Inject(SlackService) private readonly slack: SlackService,
    private eventEmitter: EventEmitter2,
  ) {}

  //? ----------------------------------------------------------------------- //
  //? CREATE
  //? ----------------------------------------------------------------------- //

  async create(dto: CreateAnswerCommentDto): Promise<AnswerComment> {
    // creation
    const answer_comment = await this.repository.save(this.repository.create(dto));

    // fetch data for notification recipient
    const answer_commentWithUser = await this.findById(answer_comment.id, [
      'user',
      'answer',
      'answer.user',
      'answer.user.profile',
    ]);
    // notification with event listener ------------------------------------//
    const event = new UserNotificationEvent();
    event.name = 'answerComment';
    event.userId = answer_commentWithUser.answer.user.id;
    event.token = answer_commentWithUser.answer.user.pushToken;
    event.options = answer_commentWithUser.answer.user.profile?.options ?? {};
    event.body = `내 발견글에 누군가 댓글을 남겼습니다.`;
    event.data = {
      page: `answers/${dto.answerId}`,
      args: '',
    };
    this.eventEmitter.emit('user.notified', event);

    this.answerRepository.increment(
      { id: dto.answerId },
      `answer_commentCount`,
      1,
    );

    return answer_commentWithUser;
  }

  //? ----------------------------------------------------------------------- //
  //? READ
  //? ----------------------------------------------------------------------- //

  async findAll(query: PaginateQuery): Promise<Paginated<AnswerComment>> {
    const queryBuilder = this.repository
      .createQueryBuilder('answer_comment')
      .innerJoinAndSelect('answer_comment.user', 'user')
      .innerJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('answer_comment.children', 'children')
      .leftJoinAndSelect('children.user', 'replier')
      .where('answer_comment.parentId IS NULL')
      .andWhere('answer_comment.deletedAt IS NULL');

    const config: PaginateConfig<AnswerComment> = {
      sortableColumns: ['id'],
      searchableColumns: ['body'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        answerId: [FilterOperator.EQ],
        isFlagged: [FilterOperator.EQ],
      },
    };

    return await paginate<AnswerComment>(query, queryBuilder, config);
  }

  async findAllById(
    answerId: number,
    answer_commentId: number,
    query: PaginateQuery,
  ): Promise<Paginated<AnswerComment>> {
    const queryBuilder = this.repository
      .createQueryBuilder('answer_comment')
      .innerJoinAndSelect('answer_comment.user', 'user')
      .innerJoinAndSelect('user.profile', 'profile')
      .where('answer_comment.answerId = :answerId', { answerId })
      .andWhere('answer_comment.parentId = :answer_commentId', { answer_commentId })
      // .andWhere(
      //   new Brackets((qb) => {
      //     qb.where('answer_comment.id = :answer_commentId', { answer_commentId }).orWhere(
      //       'answer_comment.parentId = :answer_commentId',
      //       { answer_commentId },
      //     );
      //   }),
      // )
      .andWhere('answer_comment.deletedAt IS NULL');

    const config: PaginateConfig<AnswerComment> = {
      sortableColumns: ['id'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'ASC']],
      filterableColumns: {
        isFlagged: [FilterOperator.EQ],
        // userId: [FilterOperator.EQ, FilterOperator.IN],
      },
    };

    return await paginate<AnswerComment>(query, queryBuilder, config);
  }

  async findById(id: number, relations: string[] = []): Promise<AnswerComment> {
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

  async findByUniqueKey(params: FindOneOptions): Promise<AnswerComment | null> {
    return await this.repository.findOne(params);
  }

  //? ----------------------------------------------------------------------- //
  //? UPDATE
  //? ----------------------------------------------------------------------- //

  async update(id: number, dto: UpdateAnswerCommentDto): Promise<AnswerComment> {
    const answer_comment = await this.repository.preload({ id, ...dto });
    if (!answer_comment) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(answer_comment);
  }

  //? ----------------------------------------------------------------------- //
  //? DELETE
  //? ----------------------------------------------------------------------- //

  async softRemove(id: number): Promise<AnswerComment> {
    try {
      const answer_comment = await this.findById(id);
      await this.repository.softRemove(answer_comment);
      await this.answerRepository.manager.query(
        `UPDATE answer SET answer_commentCount = answer_commentCount - 1 WHERE id = ? AND answer_commentCount > 0`,
        [answer_comment.answerId],
      );
      return answer_comment;
    } catch (e) {
      this.logger.log(e);
    }
  }

  async remove(id: number): Promise<AnswerComment> {
    const answer_comment = await this.findById(id);
    return await this.repository.remove(answer_comment);
  }
}
