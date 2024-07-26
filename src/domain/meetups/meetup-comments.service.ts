import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  paginate,
  PaginateConfig,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { REDIS_PUBSUB_CLIENT } from 'src/common/constants';
import { SignedUrl } from 'src/common/types';
import { CreateMeetupCommentDto } from 'src/domain/meetups/dto/create-meetup_comment.dto';
import { UpdateMeetupCommentDto } from 'src/domain/meetups/dto/update-meetup_comment.dto';
import { MeetupComment } from 'src/domain/meetups/entities/meetup_comment.entity';
import { UserNotificationEvent } from 'src/domain/users/events/user-notification.event';
import { randomImageName } from 'src/helpers/random-filename';
import { S3Service } from 'src/services/aws/s3.service';
import { IsNull, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { SignedUrlDto } from 'src/domain/users/dto/signed-url.dto';

@Injectable()
export class MeetupCommentsService {
  private readonly logger = new Logger(MeetupCommentsService.name);

  constructor(
    @InjectRepository(Meetup)
    private readonly meetupRepository: Repository<Meetup>,
    @InjectRepository(MeetupComment)
    private readonly meetupCommentRepository: Repository<MeetupComment>,
    @Inject(REDIS_PUBSUB_CLIENT) private readonly redisClient: ClientProxy,
    private readonly s3Service: S3Service,
    private eventEmitter: EventEmitter2,
  ) {}

  //? ----------------------------------------------------------------------- //
  //? CREATE
  //? ----------------------------------------------------------------------- //

  async create(dto: CreateMeetupCommentDto): Promise<MeetupComment> {
    // creation
    const comment = await this.meetupCommentRepository.save(
      this.meetupCommentRepository.create(dto),
    );
    if (dto.sendNotification) {
      //? notify with event listener
      const record = await this.findById(comment.id, [
        'user',
        'meetup',
        'meetup.user',
        'meetup.user.profile',
      ]);

      if (record.meetup.user.id != dto.userId) {
        const event = new UserNotificationEvent();
        event.name = 'meetupComment';
        event.userId = record.meetup.user.id;
        event.token = record.meetup.user.pushToken;
        event.options = record.meetup.user.profile?.options ?? {};
        event.body = `${record.meetup.title} 모임에 누군가 댓글을 달았습니다.`;
        event.data = {
          page: `meetups/${dto.meetupId}`,
        };
        this.eventEmitter.emit('user.notified', event);
      }
    }

    this.meetupRepository.increment({ id: dto.meetupId }, `commentCount`, 1);

    return comment;
  }

  //? ----------------------------------------------------------------------- //
  //? READ
  //? ----------------------------------------------------------------------- //

  //? comments w/ replies (children)
  async findAllInTraditionalStyle(
    query: PaginateQuery,
    meetupId: number,
  ): Promise<Paginated<MeetupComment>> {
    return paginate(query, this.meetupCommentRepository, {
      where: {
        meetupId: meetupId,
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
    meetupId: number,
  ): Promise<Paginated<MeetupComment>> {
    const queryBuilder = this.meetupCommentRepository
      .createQueryBuilder('comment')
      .innerJoinAndSelect('comment.user', 'user')
      .loadRelationCountAndMap('comment.replyCount', 'comment.children')
      .where('comment.parentId IS NULL')
      .andWhere('comment.meetupId = :meetupId', { meetupId });

    const config: PaginateConfig<MeetupComment> = {
      sortableColumns: ['id'],
      searchableColumns: ['body'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        meetupId: [FilterOperator.EQ],
        isFlagged: [FilterOperator.EQ],
      },
    };

    return await paginate<MeetupComment>(query, queryBuilder, config);
  }

  // 답글 리스트
  async findAllRepliesById(
    query: PaginateQuery,
    meetupId: number,
    commentId: number,
  ): Promise<Paginated<MeetupComment>> {
    const queryBuilder = this.meetupCommentRepository
      .createQueryBuilder('comment')
      .innerJoinAndSelect('comment.user', 'user')
      .where('comment.meetupId = :meetupId', { meetupId })
      .andWhere('comment.parentId = :commentId', { commentId })
      .andWhere('comment.deletedAt IS NULL');

    const config: PaginateConfig<MeetupComment> = {
      sortableColumns: ['id'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'ASC']],
      filterableColumns: {
        isFlagged: [FilterOperator.EQ],
      },
    };

    return await paginate<MeetupComment>(query, queryBuilder, config);
  }

  // required when checking if the comment exists
  async findById(id: number, relations: string[] = []): Promise<MeetupComment> {
    try {
      return relations.length > 0
        ? await this.meetupCommentRepository.findOneOrFail({
            where: { id },
            relations,
          })
        : await this.meetupCommentRepository.findOneOrFail({
            where: { id },
          });
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }

  // reserved. no use cases as of yet.
  async count(body: string): Promise<number> {
    return await this.meetupCommentRepository.countBy({
      body: body,
    });
  }

  //? ----------------------------------------------------------------------- //
  //? UPDATE
  //? ----------------------------------------------------------------------- //

  async update(
    dto: UpdateMeetupCommentDto,
    commentId: number,
  ): Promise<MeetupComment> {
    const comment = await this.meetupCommentRepository.preload({
      id: commentId,
      ...dto,
    });
    // user validation here might be a good option to be added
    if (!comment) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.meetupCommentRepository.save(comment);
  }

  //? ----------------------------------------------------------------------- //
  //? DELETE
  //? ----------------------------------------------------------------------- //

  async softRemove(id: number): Promise<MeetupComment> {
    try {
      const comment = await this.findById(id);
      await this.meetupCommentRepository.softRemove(comment);
      await this.meetupRepository.manager.query(
        `UPDATE meetup SET commentCount = commentCount - 1 WHERE id = ? AND commentCount > 0`,
        [comment.meetupId],
      );
      return comment;
    } catch (e) {
      this.logger.log(e);
      throw e;
    }
  }

  //! not being used.
  async remove(id: number): Promise<MeetupComment> {
    const comment = await this.findById(id);
    return await this.meetupCommentRepository.remove(comment);
  }

  //? ----------------------------------------------------------------------- //
  //? UPLOAD
  //? ----------------------------------------------------------------------- //

  // S3 직접 업로드를 위한 signedUrl 리턴
  async getSignedUrl(userId: number, dto: SignedUrlDto): Promise<SignedUrl> {
    const fileUri = randomImageName(dto.name ?? 'comment', dto.mimeType);
    const path = `${process.env.NODE_ENV}/comments/${userId}/${fileUri}`;
    const url = await this.s3Service.generateSignedUrl(path);

    return {
      upload: url,
      image: `https://cdn.mesoapp.kr/${path}`,
    };
  }
}
