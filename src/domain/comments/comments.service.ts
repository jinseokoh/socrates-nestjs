import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  PaginateConfig,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { CreateCommentDto } from 'src/domain/comments/dto/create-comment.dto';
import { UpdateCommentDto } from 'src/domain/comments/dto/update-comment.dto';
import { Question } from 'src/domain/questions/entities/question.entity';
import { Comment } from 'src/domain/comments/entities/comment.entity';
import { Brackets, FindOneOptions, Repository } from 'typeorm';

@Injectable()
export class CommentsService {
  constructor(
    // @Inject(SlackService) private readonly slack: SlackService,
    @InjectRepository(Comment)
    private readonly repository: Repository<Comment>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  async create(dto: CreateCommentDto): Promise<Comment> {
    try {
      const question = await this.questionRepository.findOneOrFail({
        where: {
          id: dto.questionId,
        },
      });
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
    const comment = await this.repository.save(this.repository.create(dto));

    // const questionTitle = question.title.replace(/[\<\>]/g, '');
    // await this.slack.postMessage({
    //   channel: 'major',
    //   text: `[${process.env.NODE_ENV}-api] 📝 아티클댓글 : <${process.env.ADMIN_URL}/questions/show/${question.id}|${questionTitle}>`,
    // });

    return comment;
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  async findAll(id: number, query: PaginateQuery): Promise<Paginated<Comment>> {
    const queryBuilder = this.repository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.children', 'children')
      .leftJoinAndSelect('children.user', 'childrenUser')
      .where('comment.question = :questionId', { questionId: id })
      .andWhere('comment.parentId IS NULL')
      .andWhere('childrenUser.deletedAt IS NULL')
      .andWhere('comment.deletedAt IS NULL');
    // .andWhere('comment.parentId IS NULL');

    const config: PaginateConfig<Comment> = {
      sortableColumns: ['id'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        // userId: [FilterOperator.EQ, FilterOperator.IN],
      },
    };

    return await paginate<Comment>(query, queryBuilder, config);
  }

  async findAllById(
    questionId: number,
    commentId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Comment>> {
    const queryBuilder = this.repository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .where('comment.question = :questionId', { questionId })
      .andWhere(
        new Brackets((qb) => {
          qb.where('comment.id = :commentId', { commentId }).orWhere(
            'comment.parentId = :commentId',
            { commentId },
          );
        }),
      )
      .andWhere('comment.deletedAt IS NULL');

    const config: PaginateConfig<Comment> = {
      sortableColumns: ['id'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'ASC']],
      filterableColumns: {
        // userId: [FilterOperator.EQ, FilterOperator.IN],
      },
    };

    return await paginate<Comment>(query, queryBuilder, config);
  }

  async findById(id: number, relations: string[] = []): Promise<Comment> {
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

  async findByUniqueKey(params: FindOneOptions): Promise<Comment | null> {
    return await this.repository.findOne(params);
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  async update(id: number, dto: UpdateCommentDto): Promise<Comment> {
    const comment = await this.repository.preload({ id, ...dto });
    if (!comment) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(comment);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  async softRemove(id: number): Promise<Comment> {
    const comment = await this.findById(id);
    return await this.repository.softRemove(comment);
  }

  async remove(id: number): Promise<Comment> {
    const comment = await this.findById(id);
    return await this.repository.remove(comment);
  }
}
