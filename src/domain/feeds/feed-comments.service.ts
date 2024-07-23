import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  PaginateConfig,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { CreateFeedCommentDto } from 'src/domain/feeds/dto/create-comment.dto';
import { Feed } from 'src/domain/feeds/entities/feed.entity';
import { FeedComment } from 'src/domain/feeds/entities/feed_comment.entity';
import { IsNull, Repository } from 'typeorm';
import { UpdateFeedCommentDto } from 'src/domain/feeds/dto/update-comment.dto';
import { UserNotificationEvent } from 'src/domain/users/events/user-notification.event';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class FeedCommentsService {
  private readonly logger = new Logger(FeedCommentsService.name);

  constructor(
    @InjectRepository(FeedComment)
    private readonly repository: Repository<FeedComment>,
    @InjectRepository(Feed)
    private readonly feedRepository: Repository<Feed>,
    // @Inject(SlackService) private readonly slack: SlackService,
    private eventEmitter: EventEmitter2,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  async create(dto: CreateFeedCommentDto): Promise<FeedComment> {
    // creation
    const comment = await this.repository.save(this.repository.create(dto));
    if (dto.sendNotification) {
      //? notify with event listener
      const record = await this.findById(comment.id, [
        'user',
        'feed',
        'feed.user',
        'feed.user.profile',
      ]);

      if (record.feed.user.id != dto.userId) {
        const event = new UserNotificationEvent();
        event.name = 'feedFeedComment';
        event.userId = record.feed.user.id;
        event.token = record.feed.user.pushToken;
        event.options = record.feed.user.profile?.options ?? {};
        event.body = `내 피드에 누군가 댓글을 남겼습니다.`;
        event.data = {
          page: `feeds/${dto.feedId}`,
          args: '',
        };
        this.eventEmitter.emit('user.notified', event);
      }
    }

    await this.feedRepository.increment({ id: dto.feedId }, `commentCount`, 1);

    return comment;
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  //? comments w/ replies (children)
  async findAllInTraditionalStyle(
    query: PaginateQuery,
    feedId: number,
  ): Promise<Paginated<FeedComment>> {
    return paginate(query, this.repository, {
      where: {
        feedId: feedId,
        parentId: IsNull(),
      },
      relations: ['user', 'children', 'children.user'],
      sortableColumns: ['createdAt'],
      defaultSortBy: [['createdAt', 'DESC']],
      defaultLimit: 20,
    });
    // return await paginate<FeedComment>(query, queryBuilder, config);
  }

  //? comments w/ replyCount
  async findAllInYoutubeStyle(
    query: PaginateQuery,
    feedId: number,
  ): Promise<Paginated<FeedComment>> {
    const queryBuilder = this.repository
      .createQueryBuilder('comment')
      .innerJoinAndSelect('comment.user', 'user')
      .loadRelationCountAndMap('comment.replyCount', 'comment.children')
      .where('comment.parentId IS NULL')
      .andWhere('comment.feedId = :feedId', { feedId });

    const config: PaginateConfig<FeedComment> = {
      sortableColumns: ['id'],
      searchableColumns: ['body'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        feedId: [FilterOperator.EQ],
        isFlagged: [FilterOperator.EQ],
      },
    };

    return await paginate<FeedComment>(query, queryBuilder, config);
  }

  async findAllRepliesById(
    query: PaginateQuery,
    feedId: number,
    commentId: number,
  ): Promise<Paginated<FeedComment>> {
    const queryBuilder = this.repository
      .createQueryBuilder('comment')
      .innerJoinAndSelect('comment.user', 'user')
      .where('comment.feedId = :feedId', { feedId })
      .andWhere('comment.parentId = :commentId', { commentId })
      .andWhere('comment.deletedAt IS NULL');

    const config: PaginateConfig<FeedComment> = {
      sortableColumns: ['id'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'ASC']],
      filterableColumns: {
        isFlagged: [FilterOperator.EQ],
      },
    };

    return await paginate<FeedComment>(query, queryBuilder, config);
  }

  async findById(id: number, relations: string[] = []): Promise<FeedComment> {
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

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  async update(dto: UpdateFeedCommentDto, commentId: number): Promise<FeedComment> {
    const comment = await this.repository.preload({ id: commentId, ...dto });
    if (!comment) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(comment);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  async softRemove(id: number): Promise<FeedComment> {
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
      throw e;
    }
  }

  //! not being used)
  async remove(id: number): Promise<FeedComment> {
    const comment = await this.findById(id);
    return await this.repository.remove(comment);
  }

  //! not being used) recursive tree 구조일 경우 사용.
  public buildFeedCommentTree(comment: FeedComment): FeedComment {
    if (comment.children) {
      comment.children = comment.children.map((child) =>
        this.buildFeedCommentTree(child),
      );
    }
    return comment;
  }
}
