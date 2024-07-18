import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  PaginateConfig,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { CreateCommentDto } from 'src/domain/feeds/dto/create-comment.dto';

import { Feed } from 'src/domain/feeds/entities/feed.entity';
import { Comment } from 'src/domain/feeds/entities/comment.entity';
import { FindOneOptions, Repository } from 'typeorm';
import { REDIS_PUBSUB_CLIENT } from 'src/common/constants';
import { ClientProxy } from '@nestjs/microservices';
import { UpdateCommentDto } from 'src/domain/feeds/dto/update-comment.dto';
import { UserNotificationEvent } from 'src/domain/users/events/user-notification.event';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    @InjectRepository(Comment)
    private readonly repository: Repository<Comment>,
    @InjectRepository(Feed)
    private readonly feedRepository: Repository<Feed>,
    @Inject(REDIS_PUBSUB_CLIENT) private readonly redisClient: ClientProxy,
    // @Inject(SlackService) private readonly slack: SlackService,
    private eventEmitter: EventEmitter2,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  async create(dto: CreateCommentDto): Promise<Comment> {
    // creation
    const comment = await this.repository.save(this.repository.create(dto));

    // fetch data for notification recipient
    const commentWithUser = await this.findById(comment.id, [
      'user',
      'feed',
      'feed.user',
      'feed.user.profile',
    ]);
    // notification with event listener ------------------------------------//
    const event = new UserNotificationEvent();
    event.name = 'feedComment';
    event.userId = commentWithUser.feed.user.id;
    event.token = commentWithUser.feed.user.pushToken;
    event.options = commentWithUser.feed.user.profile?.options ?? {};
    event.body = `내 발견글에 누군가 댓글을 남겼습니다.`;
    event.data = {
      page: `feeds/${dto.feedId}`,
      args: '',
    };
    this.eventEmitter.emit('user.notified', event);

    this.feedRepository.increment({ id: dto.feedId }, `commentCount`, 1);

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
      .where('comment.parentId IS NULL')
      .andWhere('comment.deletedAt IS NULL');

    const config: PaginateConfig<Comment> = {
      sortableColumns: ['id'],
      searchableColumns: ['body'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        feedId: [FilterOperator.EQ],
        isFlagged: [FilterOperator.EQ],
      },
    };

    return await paginate<Comment>(query, queryBuilder, config);
  }

  async findAllById(
    feedId: number,
    commentId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Comment>> {
    const queryBuilder = this.repository
      .createQueryBuilder('comment')
      .innerJoinAndSelect('comment.user', 'user')
      .innerJoinAndSelect('user.profile', 'profile')
      .where('comment.feedId = :feedId', { feedId })
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
    try {
      const comment = await this.findById(id);
      await this.repository.softRemove(comment);
      await this.feedRepository.manager.query(
        `UPDATE feed SET commentCount = commentCount - 1 WHERE id = ? AND commentCount > 0`,
        [comment.feedId],
      );
      return comment;
    } catch (e) {
      this.logger.log(e);
    }
  }

  async remove(id: number): Promise<Comment> {
    const comment = await this.findById(id);
    return await this.repository.remove(comment);
  }
}
