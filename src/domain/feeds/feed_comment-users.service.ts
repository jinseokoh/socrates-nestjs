import {
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  PaginateConfig,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { Feed } from 'src/domain/feeds/entities/feed.entity';
import { FeedComment } from 'src/domain/feeds/entities/feed_comment.entity';
import { DataSource, IsNull, Repository } from 'typeorm';
import { UserNotificationEvent } from 'src/domain/users/events/user-notification.event';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomImageName } from 'src/helpers/random-filename';
import { SignedUrlDto } from 'src/domain/users/dto/signed-url.dto';
import { SignedUrl } from 'src/common/types';
import { S3Service } from 'src/services/aws/s3.service';
import { Flag } from 'src/domain/users/entities/flag.entity';
import { CreateFeedCommentDto } from 'src/domain/feeds/dto/create-feed_comment.dto';
import { UpdateFeedCommentDto } from 'src/domain/feeds/dto/update-feed_comment.dto';

@Injectable()
export class FeedCommentUsersService {
  private readonly logger = new Logger(FeedCommentUsersService.name);

  constructor(
    @InjectRepository(Feed)
    private readonly feedRepository: Repository<Feed>,
    @InjectRepository(FeedComment)
    private readonly feedCommentRepository: Repository<FeedComment>,
    private readonly s3Service: S3Service,
    private eventEmitter: EventEmitter2,
    private dataSource: DataSource, // for transaction
  ) {}

  //? ----------------------------------------------------------------------- //
  //? Feed 댓글 생성
  //? ----------------------------------------------------------------------- //

  async create(dto: CreateFeedCommentDto): Promise<FeedComment> {
    // creation
    const comment = await this.feedCommentRepository.save(
      this.feedCommentRepository.create(dto),
    );
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
        event.name = 'feed';
        event.userId = record.feed.user.id;
        event.token = record.feed.user.pushToken;
        event.options = record.feed.user.profile?.options ?? {};
        event.body = `${record.feed.title} 피드에 새로운 댓글이 있습니다.`;
        event.data = {
          page: `feeds/${dto.feedId}`,
        };
        this.eventEmitter.emit('user.notified', event);
      }
    }

    await this.feedRepository.increment({ id: dto.feedId }, `commentCount`, 1);

    return comment;
  }

  //? ----------------------------------------------------------------------- //
  //? Feed 댓글 리스트
  //? ----------------------------------------------------------------------- //

  //? comments w/ replies (children)
  async findAllInTraditionalStyle(
    query: PaginateQuery,
    feedId: number,
  ): Promise<Paginated<FeedComment>> {
    return paginate(query, this.feedCommentRepository, {
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
    const queryBuilder = this.feedCommentRepository
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

  //? 답글 리스트, 최상단 부모는 리턴되지 않음.
  async findAllRepliesById(
    query: PaginateQuery,
    feedId: number,
    commentId: number,
  ): Promise<Paginated<FeedComment>> {
    const queryBuilder = this.feedCommentRepository
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
        ? await this.feedCommentRepository.findOneOrFail({
            where: { id },
            relations,
          })
        : await this.feedCommentRepository.findOneOrFail({
            where: { id },
          });
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }

  // reserved. no use cases as of yet.
  async count(body: string): Promise<number> {
    return await this.feedCommentRepository.countBy({
      body: body,
    });
  }

  //? ----------------------------------------------------------------------- //
  //? Feed 댓글 update
  //? ----------------------------------------------------------------------- //

  async update(
    commentId: number,
    dto: UpdateFeedCommentDto,
  ): Promise<FeedComment> {
    const comment = await this.feedCommentRepository.preload({
      id: commentId,
      ...dto,
    });
    // user validation here might be a good option to be added
    if (!comment) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.feedCommentRepository.save(comment);
  }

  //? ----------------------------------------------------------------------- //
  //? Feed 댓글 delete
  //? ----------------------------------------------------------------------- //

  async softRemove(id: number): Promise<FeedComment> {
    try {
      const comment = await this.findById(id);
      await this.feedCommentRepository.softRemove(comment);
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

  //! not being used.
  async remove(id: number): Promise<FeedComment> {
    const comment = await this.findById(id);
    return await this.feedCommentRepository.remove(comment);
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

  //? ----------------------------------------------------------------------- //
  //? Feed 댓글 Flag
  //? ----------------------------------------------------------------------- //

  async createFeedCommentFlag(
    userId: number,
    feedId: number,
    commentId: number,
    message: string,
  ): Promise<Flag> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const flag = await queryRunner.manager.save(
        queryRunner.manager.getRepository(Flag).create({
          userId,
          entityType: 'feed_comment',
          entityId: commentId,
          message,
        }),
      );
      await queryRunner.manager.query(
        'UPDATE `feed_comment` SET flagCount = flagCount + 1 WHERE id = ?',
        [commentId],
      );
      await queryRunner.commitTransaction();
      return flag;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error.code === 'ER_DUP_ENTRY') {
        throw new UnprocessableEntityException(`entity exists`);
      } else {
        throw error;
      }
    } finally {
      await queryRunner.release();
    }
  }

  async deleteFeedCommentFlag(userId: number, commentId: number): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const { affectedRows } = await queryRunner.manager.query(
        'DELETE FROM `flag` where userId = ? AND entityType = ? AND entityId = ?',
        [userId, `feed_comment`, commentId],
      );
      if (affectedRows > 0) {
        await queryRunner.manager.query(
          'UPDATE `feed_comment` SET flagCount = flagCount - 1 WHERE id = ? AND flagCount > 0',
          [commentId],
        );
      }
      return { data: affectedRows };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  //? ----------------------------------------------------------------------- //
  //? Upload
  //? ----------------------------------------------------------------------- //

  // S3 직접 업로드를 위한 signedUrl 리턴
  async getSignedUrl(
    userId: number,
    feedId: number,
    dto: SignedUrlDto,
  ): Promise<SignedUrl> {
    const fileUri = randomImageName(
      dto.name ?? `feed_${feedId}_comment`,
      dto.mimeType,
    );
    const path = `${process.env.NODE_ENV}/feed_comments/${userId}/${fileUri}`;
    const url = await this.s3Service.generateSignedUrl(path);

    return {
      upload: url,
      image: `https://cdn.mesoapp.kr/${path}`,
    };
  }
}
