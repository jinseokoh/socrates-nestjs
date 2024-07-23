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
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { SignedUrlDto } from 'src/domain/users/dto/signed-url.dto';

@Injectable()
export class MeetupCommentsService {
  private readonly logger = new Logger(MeetupCommentsService.name);

  constructor(
    @InjectRepository(MeetupComment)
    private readonly repository: Repository<MeetupComment>,
    @InjectRepository(Meetup)
    private readonly meetupRepository: Repository<Meetup>,
    @Inject(REDIS_PUBSUB_CLIENT) private readonly redisClient: ClientProxy,
    private readonly s3Service: S3Service,
    private eventEmitter: EventEmitter2,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  async create(dto: CreateMeetupCommentDto): Promise<MeetupComment> {
    // creation
    const thread = await this.repository.save(this.repository.create(dto));

    // fetch data for notification recipient
    const threadWithUser = await this.findById(thread.id, [
      'user',
      'meetup',
      'meetup.user',
      'meetup.user.profile',
    ]);
    // notification with event listener ------------------------------------//
    const event = new UserNotificationEvent();
    event.name = 'meetupMeetupComment';
    event.userId = threadWithUser.meetup.user.id;
    event.token = threadWithUser.meetup.user.pushToken;
    event.options = threadWithUser.meetup.user.profile?.options ?? {};
    event.body = `${threadWithUser.meetup.title} 모임에 누군가 댓글을 달았습니다.`;
    event.data = {
      page: `meetups/${dto.meetupId}`,
      args: '',
    };
    this.eventEmitter.emit('user.notified', event);

    // this.meetupRepository.increment({ id: dto.meetupId }, `threadCount`, 1);

    // notify slack
    return threadWithUser;
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  // 댓글 리스트
  async findAll(query: PaginateQuery): Promise<Paginated<MeetupComment>> {
    const queryBuilder = this.repository
      .createQueryBuilder('thread')
      .innerJoinAndSelect('thread.user', 'user')
      .leftJoinAndSelect('thread.children', 'children')
      .leftJoinAndSelect('children.user', 'ruser')
      .where('thread.parentId IS NULL')
      .andWhere('thread.deletedAt IS NULL');
    // to make all flagged thread disappear
    // .andWhere('children.isFlagged = :isFlagged', { isFlagged: false });

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

    return await paginate(query, queryBuilder, config);
  }

  // 답글 리스트
  async findAllById(
    meetupId: number,
    threadId: number,
    query: PaginateQuery,
  ): Promise<Paginated<MeetupComment>> {
    const queryBuilder = this.repository
      .createQueryBuilder('thread')
      .innerJoinAndSelect('thread.user', 'user')
      .where('thread.meetupId = :meetupId', { meetupId })
      .andWhere('thread.parentId = :threadId', { threadId })
      // .andWhere(
      //   new Brackets((qb) => {
      //     qb.where('thread.id = :threadId', { threadId }).orWhere(
      //       'thread.parentId = :threadId',
      //       { threadId },
      //     );
      //   }),
      // )
      .andWhere('thread.deletedAt IS NULL');

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

  // required when checking if the thread exists
  async findById(id: number, relations: string[] = []): Promise<MeetupComment> {
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

  // reserved. no use cases as of yet.
  async count(body: string): Promise<number> {
    return await this.repository.countBy({
      body: body,
    });
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  async update(id: number, dto: UpdateMeetupCommentDto): Promise<MeetupComment> {
    const thread = await this.repository.preload({ id, ...dto });
    // user validation here might be a good option to be added
    if (!thread) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(thread);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  async softRemove(id: number): Promise<MeetupComment> {
    const thread = await this.findById(id);
    // user validation here might be a good option to be added
    return await this.repository.softRemove(thread);
  }

  async remove(id: number): Promise<MeetupComment> {
    const thread = await this.findById(id);
    // user validation here might be a good option to be added
    return await this.repository.remove(thread);
  }

  //?-------------------------------------------------------------------------//
  //? UPLOAD
  //?-------------------------------------------------------------------------//

  // S3 직접 업로드를 위한 signedUrl 리턴
  async getSignedUrl(userId: number, dto: SignedUrlDto): Promise<SignedUrl> {
    const fileUri = randomImageName(dto.name ?? 'thread', dto.mimeType);
    const path = `${process.env.NODE_ENV}/threads/${userId}/${fileUri}`;
    const url = await this.s3Service.generateSignedUrl(path);

    return {
      upload: url,
      image: `https://cdn.mesoapp.kr/${path}`,
    };
  }
}
