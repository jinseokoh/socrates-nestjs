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
import { Inquiry } from 'src/domain/inquiries/entities/inquiry.entity';
import { InquiryComment } from 'src/domain/inquiries/entities/inquiry_comment.entity';
import { DataSource, FindOneOptions, IsNull, Repository } from 'typeorm';
import { UserNotificationEvent } from 'src/domain/users/events/user-notification.event';
import { randomImageName } from 'src/helpers/random-filename';
import { SignedUrl } from 'src/common/types';
import { SignedUrlDto } from 'src/domain/users/dto/signed-url.dto';
import { CreateInquiryCommentDto } from 'src/domain/inquiries/dto/create-inquiry_comment.dto';
import { UpdateInquiryCommentDto } from 'src/domain/inquiries/dto/update-inquiry_comment.dto';
import { S3Service } from 'src/services/aws/s3.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Flag } from 'src/domain/users/entities/flag.entity';

@Injectable()
export class InquiryCommentUsersService {
  private readonly logger = new Logger(InquiryCommentUsersService.name);

  constructor(
    @InjectRepository(Inquiry)
    private readonly inquiryRepository: Repository<Inquiry>,
    @InjectRepository(InquiryComment)
    private readonly inquiryCommentRepository: Repository<InquiryComment>,
    private readonly s3Service: S3Service,
    private eventEmitter: EventEmitter2,
    private dataSource: DataSource, // for transaction
  ) {}

  //? ----------------------------------------------------------------------- //
  //? inquiry 댓글 생성
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
        event.name = 'inquiry';
        event.userId = record.inquiry.user.id;
        event.token = record.inquiry.user.pushToken;
        event.options = record.inquiry.user.profile?.options ?? {};
        event.body = `${record.inquiry.title} 질의에 새로운 댓글이 있습니다.`;
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
  //? inquiry 댓글 리스트
  //? ----------------------------------------------------------------------- //

  //? 댓글 리스트 w/ Pagination (children)
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

  //? 댓글 리스트 w/ Pagination
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

  //? 답글 리스트, 최상단 부모는 리턴되지 않음.
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
      },
    };

    return await paginate<InquiryComment>(query, queryBuilder, config);
  }

  // required when checking if the comment exists
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
  //? inquiry 댓글 update
  //? ----------------------------------------------------------------------- //

  async update(
    commentId: number,
    dto: UpdateInquiryCommentDto,
  ): Promise<InquiryComment> {
    const comment = await this.inquiryCommentRepository.preload({
      id: commentId,
      ...dto,
    });
    // user validation here might be a good option to be added
    if (!comment) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.inquiryCommentRepository.save(comment);
  }

  //? ----------------------------------------------------------------------- //
  //? inquiry 댓글 delete
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
  //? inquiry 댓글 Flag
  //? ----------------------------------------------------------------------- //

  async createInquiryCommentFlag(
    userId: number,
    inquiryId: number,
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
          entityType: 'inquiry_comment',
          entityId: commentId,
          message,
        }),
      );
      await queryRunner.manager.query(
        'UPDATE `inquiry_comment` SET flagCount = flagCount + 1 WHERE id = ?',
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

  async deleteInquiryCommentFlag(
    userId: number,
    commentId: number,
  ): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const { affectedRows } = await queryRunner.manager.query(
        'DELETE FROM `flag` where userId = ? AND entityType = ? AND entityId = ?',
        [userId, `inquiry_comment`, commentId],
      );
      if (affectedRows > 0) {
        await queryRunner.manager.query(
          'UPDATE `inquiry_comment` SET flagCount = flagCount - 1 WHERE id = ? AND flagCount > 0',
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
  //? UPLOAD
  //? ----------------------------------------------------------------------- //

  // S3 직접 업로드를 위한 signedUrl 리턴
  async getSignedUrl(
    userId: number,
    inquiryId: number,
    dto: SignedUrlDto,
  ): Promise<SignedUrl> {
    const fileUri = randomImageName(
      dto.name ?? `inquiry_${inquiryId}_comment`,
      dto.mimeType,
    );
    const path = `${process.env.NODE_ENV}/inquiry_comments/${userId}/${fileUri}`;
    const url = await this.s3Service.generateSignedUrl(path);

    return {
      upload: url,
      image: `https://cdn.mesoapp.kr/${path}`,
    };
  }
}
