import { Inject, Injectable, NotFoundException } from '@nestjs/common';
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
  constructor(
    @InjectRepository(Comment)
    private readonly repository: Repository<Comment>,
    @InjectRepository(Inquiry)
    private readonly inquiryRepository: Repository<Inquiry>,
    // @Inject(SlackService) private readonly slack: SlackService,
    @Inject(REDIS_PUBSUB_CLIENT) private readonly redisClient: ClientProxy,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  async create(dto: CreateCommentDto): Promise<Comment> {
    // validation
    try {
      const inquiry = await this.inquiryRepository.findOneOrFail({
        where: {
          id: dto.inquiryId,
        },
      });
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
    // creation
    const comment = await this.repository.save(this.repository.create(dto));
    // fetch comment w/ user to emit SSE
    const commentWithUser = await this.findById(comment.id, ['user']);
    console.log('commentWithUser', commentWithUser);
    // emit SSE
    this.redisClient.emit('sse.add_inquiry', commentWithUser);

    // const inquiryTitle = inquiry.title.replace(/[\<\>]/g, '');
    // await this.slack.postMessage({
    //   channel: 'major',
    //   text: `[${process.env.NODE_ENV}-api] 📝 댓글 : <${process.env.ADMIN_URL}/inquirys/show/${inquiry.id}|${inquiryTitle}>`,
    // });
    return commentWithUser;
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  async findAll(
    inquiryId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Comment>> {
    const queryBuilder = this.repository
      .createQueryBuilder('comment')
      .innerJoinAndSelect('comment.user', 'user')
      .where('comment.inquiry = :inquiryId', { inquiryId });

    const config: PaginateConfig<Comment> = {
      sortableColumns: ['id'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'ASC']],
      filterableColumns: {
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
      .leftJoinAndSelect('comment.user', 'user')
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
