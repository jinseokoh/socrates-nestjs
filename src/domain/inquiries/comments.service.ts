import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  PaginateConfig,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { CreateCommentDto } from 'src/domain/inquiries/dto/create-comment.dto';

import { Inquiry } from 'src/domain/inquiries/entities/inquiry.entity';
import { Comment } from 'src/domain/inquiries/entities/comment.entity';
import { FindOneOptions, Repository } from 'typeorm';
import { REDIS_PUBSUB_CLIENT } from 'src/common/constants';
import { ClientProxy } from '@nestjs/microservices';
import { UpdateCommentDto } from 'src/domain/inquiries/dto/update-comment.dto';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    @InjectRepository(Comment)
    private readonly repository: Repository<Comment>,
    @InjectRepository(Inquiry)
    private readonly inquiryRepository: Repository<Inquiry>,
    @Inject(REDIS_PUBSUB_CLIENT) private readonly redisClient: ClientProxy,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  async create(dto: CreateCommentDto): Promise<Comment> {
    // creation
    const comment = await this.repository.save(this.repository.create(dto));
    const commentWithUser = await this.findById(comment.id, [
      'user',
      'inquiry',
      'inquiry.user',
    ]);
    console.log('commentWithUser', commentWithUser);

    this.inquiryRepository.increment({ id: dto.inquiryId }, `remarkCount`, 1);

    return commentWithUser;
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  async findAll(query: PaginateQuery): Promise<Paginated<Comment>> {
    const queryBuilder = this.repository
      .createQueryBuilder('comment')
      .innerJoinAndSelect('comment.user', 'user')
      .innerJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('comment.children', 'children')
      .leftJoinAndSelect('children.user', 'replier')
      .where('remark.parentId IS NULL')
      .andWhere('remark.deletedAt IS NULL');

    const config: PaginateConfig<Comment> = {
      sortableColumns: ['id'],
      searchableColumns: ['body'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'ASC']],
      filterableColumns: {
        inquiryId: [FilterOperator.EQ],
        isFlagged: [FilterOperator.EQ],
      },
    };

    return await paginate<Comment>(query, queryBuilder, config);
  }

  async findAllById(
    inquiryId: number,
    commentId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Comment>> {
    const queryBuilder = this.repository
      .createQueryBuilder('comment')
      .innerJoinAndSelect('comment.user', 'user')
      .innerJoinAndSelect('user.profile', 'profile')
      .where('comment.inquiryId = :inquiryId', { inquiryId })
      .andWhere('comment.parentId = :commentId', { commentId })
      // .andWhere(
      //   new Brackets((qb) => {
      //     qb.where('comment.id = :commentId', { commentId }).orWhere(
      //       'comment.parentId = :commentId',
      //       { commentId },
      //     );
      //   }),
      // )
      .andWhere('comment.deletedAt IS NULL');

    const config: PaginateConfig<Comment> = {
      sortableColumns: ['id'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'ASC']],
      filterableColumns: {
        isFlagged: [FilterOperator.EQ],
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
    await this.repository.softRemove(comment);
    await this.inquiryRepository.manager.query(
      `UPDATE inquiry SET commentCount = commentCount - 1 WHERE id = ? AND commentCount > 0`,
      [comment.inquiryId],
    );
    return comment;
  }

  async remove(id: number): Promise<Comment> {
    const comment = await this.findById(id);
    return await this.repository.remove(comment);
  }
}
