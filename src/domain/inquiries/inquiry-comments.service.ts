import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  PaginateConfig,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { CreateInquiryCommentDto } from 'src/domain/inquiries/dto/create-inquiry_comment.dto';
import { Inquiry } from 'src/domain/inquiries/entities/inquiry.entity';
import { InquiryComment } from 'src/domain/inquiries/entities/inquiry_comment.entity';
import { FindOneOptions, IsNull, Repository } from 'typeorm';
import { REDIS_PUBSUB_CLIENT } from 'src/common/constants';
import { ClientProxy } from '@nestjs/microservices';
import { UpdateInquiryCommentDto } from 'src/domain/inquiries/dto/update-inquiry_comment.dto';
import { S3Service } from 'src/services/aws/s3.service';
import { UserNotificationEvent } from 'src/domain/users/events/user-notification.event';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { randomImageName } from 'src/helpers/random-filename';
import { SignedUrlDto } from 'src/domain/users/dto/signed-url.dto';
import { SignedUrl } from 'src/common/types';

@Injectable()
export class InquiryCommentsService {
  private readonly logger = new Logger(InquiryCommentsService.name);

  constructor(
    @InjectRepository(Inquiry)
    private readonly inquiryRepository: Repository<Inquiry>,
    @InjectRepository(InquiryComment)
    private readonly inquiryCommentRepository: Repository<InquiryComment>,
    @Inject(REDIS_PUBSUB_CLIENT) private readonly redisClient: ClientProxy,
    private readonly s3Service: S3Service,
    private eventEmitter: EventEmitter2,
  ) {}

  //? ----------------------------------------------------------------------- //
  //? CREATE
  //? ----------------------------------------------------------------------- //

  async create(dto: CreateInquiryCommentDto): Promise<InquiryComment> {
    // creation
    const comment = await this.inquiryCommentRepository.save(
      this.inquiryCommentRepository.create(dto),
    );
    if (dto.sendNotification) {
      //? notify with event listener
      const record = await this.findById(comment.id, [
        'user',
        'inquiry',
        'inquiry.user',
        'inquiry.user.profile',
      ]);

      if (record.inquiry.user.id != dto.userId) {
        const event = new UserNotificationEvent();
        event.name = 'inquiryComment';
        event.userId = record.inquiry.user.id;
        event.token = record.inquiry.user.pushToken;
        event.options = record.inquiry.user.profile?.options ?? {};
        event.body = `내 피드에 누군가 댓글을 남겼습니다.`;
        event.data = {
          page: `inquiries/${dto.inquiryId}`,
        };
        this.eventEmitter.emit('user.notified', event);
      }
    }

    this.inquiryRepository.increment({ id: dto.inquiryId }, `commentCount`, 1);

    return comment;
  }

  //? ----------------------------------------------------------------------- //
  //? READ
  //? ----------------------------------------------------------------------- //

  //? comments w/ replies (children)
  async findAllInTraditionalStyle(
    query: PaginateQuery,
    inquiryId: number,
  ): Promise<Paginated<InquiryComment>> {
    return paginate(query, this.inquiryCommentRepository, {
      where: {
        inquiryId: inquiryId,
        parentId: IsNull(),
      },
      relations: ['user', 'children', 'children.user'],
      sortableColumns: ['createdAt'],
      defaultSortBy: [['createdAt', 'DESC']],
      defaultLimit: 20,
    });
    // return await paginate<InquiryComment>(query, queryBuilder, config);
  }

  //? comments w/ replyCount
  async findAllInYoutubeStyle(
    query: PaginateQuery,
    inquiryId: number,
  ): Promise<Paginated<InquiryComment>> {
    const queryBuilder = this.inquiryCommentRepository
      .createQueryBuilder('comment')
      .innerJoinAndSelect('comment.user', 'user')
      .loadRelationCountAndMap('comment.replyCount', 'comment.children')
      .where('comment.parentId IS NULL')
      .andWhere('comment.inquiryId = :inquiryId', { inquiryId });

    const config: PaginateConfig<InquiryComment> = {
      sortableColumns: ['id'],
      searchableColumns: ['body'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        inquiryId: [FilterOperator.EQ],
        isFlagged: [FilterOperator.EQ],
      },
    };

    return await paginate<InquiryComment>(query, queryBuilder, config);
  }

  // 답글 리스트
  async findAllRepliesById(
    query: PaginateQuery,
    inquiryId: number,
    commentId: number,
  ): Promise<Paginated<InquiryComment>> {
    const queryBuilder = this.inquiryCommentRepository
      .createQueryBuilder('comment')
      .innerJoinAndSelect('comment.user', 'user')
      .where('comment.inquiryId = :inquiryId', { inquiryId })
      .andWhere('comment.parentId = :commentId', { commentId })
      .andWhere('comment.deletedAt IS NULL');

    const config: PaginateConfig<InquiryComment> = {
      sortableColumns: ['id'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'ASC']],
      filterableColumns: {
        isFlagged: [FilterOperator.EQ],
        // userId: [FilterOperator.EQ, FilterOperator.IN],
      },
    };

    return await paginate<InquiryComment>(query, queryBuilder, config);
  }

  async findById(
    id: number,
    relations: string[] = [],
  ): Promise<InquiryComment> {
    try {
      return relations.length > 0
        ? await this.inquiryCommentRepository.findOneOrFail({
            where: { id },
            relations,
          })
        : await this.inquiryCommentRepository.findOneOrFail({
            where: { id },
          });
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }

  async findByUniqueKey(
    params: FindOneOptions,
  ): Promise<InquiryComment | null> {
    return await this.inquiryCommentRepository.findOne(params);
  }

  //? ----------------------------------------------------------------------- //
  //? UPDATE
  //? ----------------------------------------------------------------------- //

  async update(
    dto: UpdateInquiryCommentDto,
    inquiryId: number,
  ): Promise<InquiryComment> {
    const comment = await this.inquiryCommentRepository.preload({
      id: inquiryId,
      ...dto,
    });
    // user validation here might be a good option to be added
    if (!comment) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.inquiryCommentRepository.save(comment);
  }

  //? ----------------------------------------------------------------------- //
  //? DELETE
  //? ----------------------------------------------------------------------- //

  async softRemove(id: number): Promise<InquiryComment> {
    try {
      const comment = await this.findById(id);
      await this.inquiryCommentRepository.softRemove(comment);
      await this.inquiryRepository.manager.query(
        `UPDATE inquiry SET commentCount = commentCount - 1 WHERE id = ? AND commentCount > 0`,
        [comment.inquiryId],
      );
      return comment;
    } catch (e) {
      this.logger.log(e);
      throw e;
    }
  }

  //! not being used.
  async remove(id: number): Promise<InquiryComment> {
    const comment = await this.findById(id);
    return await this.inquiryCommentRepository.remove(comment);
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
