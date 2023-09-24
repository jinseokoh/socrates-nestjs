import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  PaginateConfig,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { Question } from 'src/domain/meetups/entities/question.entity';
import { Answer } from 'src/domain/meetups/entities/answer.entity';
import { FindOneOptions, Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { CreateAnswerDto } from 'src/domain/meetups/dto/create-answer.dto';
import { UpdateAnswerDto } from 'src/domain/meetups/dto/update-answer.dto';
import { REDIS_PUBSUB_CLIENT } from 'src/common/constants';

@Injectable()
export class AnswersService {
  constructor(
    // @Inject(SlackService) private readonly slack: SlackService,
    @Inject(REDIS_PUBSUB_CLIENT) private readonly redisClient: ClientProxy,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(Answer)
    private readonly repository: Repository<Answer>,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  async create(dto: CreateAnswerDto): Promise<Answer> {
    try {
      const question = await this.questionRepository.findOneOrFail({
        where: {
          id: dto.questionId,
        },
      });
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
    const answer = await this.repository.save(this.repository.create(dto));
    const answerWithUser = await this.findById(answer.id, ['user']);

    console.log('answerWithUser', answerWithUser);

    this.redisClient.emit('sse.answers', {
      key: 'sse.create',
      value: answerWithUser,
    });

    // const questionTitle = question.title.replace(/[\<\>]/g, '');
    // await this.slack.postMessage({
    //   channel: 'major',
    //   text: `[${process.env.NODE_ENV}-api] 📝 댓글 : <${process.env.ADMIN_URL}/questions/show/${question.id}|${questionTitle}>`,
    // });

    return answerWithUser;
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  async findAll(id: number, query: PaginateQuery): Promise<Paginated<Answer>> {
    const queryBuilder = this.repository
      .createQueryBuilder('answer')
      .leftJoinAndSelect('answer.user', 'user')
      .leftJoinAndSelect('answer.children', 'children')
      .leftJoinAndSelect('children.user', 'childrenUser')
      .where('answer.question = :questionId', { questionId: id })
      .andWhere('answer.parentId IS NULL')
      .andWhere('childrenUser.deletedAt IS NULL')
      .andWhere('answer.deletedAt IS NULL');
    // .andWhere('answer.parentId IS NULL');

    const config: PaginateConfig<Answer> = {
      sortableColumns: ['id'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        // userId: [FilterOperator.EQ, FilterOperator.IN],
      },
    };

    return await paginate<Answer>(query, queryBuilder, config);
  }

  async findAllById(
    questionId: number,
    answerId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Answer>> {
    const queryBuilder = this.repository
      .createQueryBuilder('answer')
      .leftJoinAndSelect('answer.user', 'user')
      .where('answer.question = :questionId', { questionId })
      .andWhere('answer.parentId = :answerId', { answerId })
      // .andWhere(
      //   new Brackets((qb) => {
      //     qb.where('answer.id = :answerId', { answerId }).orWhere(
      //       'answer.parentId = :answerId',
      //       { answerId },
      //     );
      //   }),
      // )
      .andWhere('answer.deletedAt IS NULL');

    const config: PaginateConfig<Answer> = {
      sortableColumns: ['id'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'ASC']],
      filterableColumns: {
        // userId: [FilterOperator.EQ, FilterOperator.IN],
      },
    };

    return await paginate<Answer>(query, queryBuilder, config);
  }

  async findById(id: number, relations: string[] = []): Promise<Answer> {
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

  async findByUniqueKey(params: FindOneOptions): Promise<Answer | null> {
    return await this.repository.findOne(params);
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  async update(id: number, dto: UpdateAnswerDto): Promise<Answer> {
    const answer = await this.repository.preload({ id, ...dto });
    if (!answer) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(answer);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  async softRemove(id: number): Promise<Answer> {
    const answer = await this.findById(id);
    return await this.repository.softRemove(answer);
  }

  async remove(id: number): Promise<Answer> {
    const answer = await this.findById(id);
    return await this.repository.remove(answer);
  }
}
