import {
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  paginate,
  PaginateConfig,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { Flag } from 'src/domain/users/entities/flag.entity';
import { Icebreaker } from 'src/domain/icebreakers/entities/icebreaker.entity';
import { IcebreakerAnswer } from 'src/domain/icebreakers/entities/icebreaker_answer.entity';
import { UserNotificationEvent } from 'src/domain/users/events/user-notification.event';
import { randomImageName } from 'src/helpers/random-filename';
import { DataSource, IsNull, Repository } from 'typeorm';
import { SignedUrl } from 'src/common/types';
import { SignedUrlDto } from 'src/domain/users/dto/signed-url.dto';
import { CreateIcebreakerAnswerDto } from 'src/domain/icebreakers/dto/create-icebreaker_answer.dto';
import { UpdateIcebreakerAnswerDto } from 'src/domain/icebreakers/dto/update-icebreaker_answer.dto';
import { S3Service } from 'src/services/aws/s3.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { truncate } from 'src/helpers/truncate';

@Injectable()
export class IcebreakerAnswerUsersService {
  private readonly logger = new Logger(IcebreakerAnswerUsersService.name);

  constructor(
    @InjectRepository(Icebreaker)
    private readonly icebreakerRepository: Repository<Icebreaker>,
    @InjectRepository(IcebreakerAnswer)
    private readonly icebreakerCommentRepository: Repository<IcebreakerAnswer>,
    private readonly s3Service: S3Service,
    private eventEmitter: EventEmitter2,
    private dataSource: DataSource, // for transaction
  ) {}

  //? ----------------------------------------------------------------------- //
  //? 모임 댓글 생성
  //? ----------------------------------------------------------------------- //

  async create(dto: CreateIcebreakerAnswerDto): Promise<IcebreakerAnswer> {
    // creation
    const comment = await this.icebreakerCommentRepository.save(
      this.icebreakerCommentRepository.create(dto),
    );
    if (dto.sendNotification) {
      //? notify with event listener
      const record = await this.findById(comment.id, [
        'user',
        'icebreaker',
        'icebreaker.user',
        'icebreaker.user.profile',
      ]);

      if (record.icebreaker.user.id != dto.userId) {
        const event = new UserNotificationEvent();
        event.name = 'icebreaker';
        event.userId = record.icebreaker.user.id;
        event.token = record.icebreaker.user.pushToken;
        event.options = record.icebreaker.user.profile?.options ?? {};
        event.body = `${truncate(record.icebreaker.body, 9)} 질문에 새로운 댓글이 있습니다.`;
        event.data = {
          page: `icebreakers/${dto.icebreakerId}`,
        };
        this.eventEmitter.emit('user.notified', event);
      }
    }

    this.icebreakerRepository.increment(
      { id: dto.icebreakerId },
      `commentCount`,
      1,
    );

    return comment;
  }

  //? ----------------------------------------------------------------------- //
  //? 모임 댓글 리스트
  //? ----------------------------------------------------------------------- //

  //? 댓글 리스트 w/ Pagination (children)
  async findAllInTraditionalStyle(
    query: PaginateQuery,
    icebreakerId: number,
  ): Promise<Paginated<IcebreakerAnswer>> {
    return paginate(query, this.icebreakerCommentRepository, {
      where: {
        icebreakerId: icebreakerId,
        parentId: IsNull(),
      },
      relations: ['user', 'children', 'children.user'],
      sortableColumns: ['createdAt'],
      defaultSortBy: [['createdAt', 'DESC']],
      defaultLimit: 20,
    });
    // return await paginate<FeedComment>(query, queryBuilder, config);
  }

  //? 댓글 리스트 w/ Pagination
  async findAllInYoutubeStyle(
    query: PaginateQuery,
    icebreakerId: number,
  ): Promise<Paginated<IcebreakerAnswer>> {
    const queryBuilder = this.icebreakerCommentRepository
      .createQueryBuilder('comment')
      .innerJoinAndSelect('comment.user', 'user')
      .loadRelationCountAndMap('comment.replyCount', 'comment.children')
      .where('comment.parentId IS NULL')
      .andWhere('comment.icebreakerId = :icebreakerId', { icebreakerId });

    const config: PaginateConfig<IcebreakerAnswer> = {
      sortableColumns: ['id'],
      searchableColumns: ['body'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        icebreakerId: [FilterOperator.EQ],
        isFlagged: [FilterOperator.EQ],
      },
    };

    return await paginate<IcebreakerAnswer>(query, queryBuilder, config);
  }

  //? 답글 리스트, 최상단 부모는 리턴되지 않음.
  async findAllRepliesById(
    query: PaginateQuery,
    icebreakerId: number,
    commentId: number,
  ): Promise<Paginated<IcebreakerAnswer>> {
    const queryBuilder = this.icebreakerCommentRepository
      .createQueryBuilder('comment')
      .innerJoinAndSelect('comment.user', 'user')
      .where('comment.icebreakerId = :icebreakerId', { icebreakerId })
      .andWhere('comment.parentId = :commentId', { commentId })
      .andWhere('comment.deletedAt IS NULL');

    const config: PaginateConfig<IcebreakerAnswer> = {
      sortableColumns: ['id'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'ASC']],
      filterableColumns: {
        isFlagged: [FilterOperator.EQ],
      },
    };

    return await paginate<IcebreakerAnswer>(query, queryBuilder, config);
  }

  // required when checking if the comment exists
  async findById(
    id: number,
    relations: string[] = [],
  ): Promise<IcebreakerAnswer> {
    try {
      return relations.length > 0
        ? await this.icebreakerCommentRepository.findOneOrFail({
            where: { id },
            relations,
          })
        : await this.icebreakerCommentRepository.findOneOrFail({
            where: { id },
          });
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }

  // reserved. no use cases as of yet.
  async count(body: string): Promise<number> {
    return await this.icebreakerCommentRepository.countBy({
      body: body,
    });
  }

  //? ----------------------------------------------------------------------- //
  //? 모임 댓글 update
  //? ----------------------------------------------------------------------- //

  async update(
    commentId: number,
    dto: UpdateIcebreakerAnswerDto,
  ): Promise<IcebreakerAnswer> {
    const comment = await this.icebreakerCommentRepository.preload({
      id: commentId,
      ...dto,
    });
    // user validation here might be a good option to be added
    if (!comment) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.icebreakerCommentRepository.save(comment);
  }

  //? ----------------------------------------------------------------------- //
  //? 모임 댓글 delete
  //? ----------------------------------------------------------------------- //

  async softRemove(id: number): Promise<IcebreakerAnswer> {
    try {
      const comment = await this.findById(id);
      await this.icebreakerCommentRepository.softRemove(comment);
      await this.icebreakerRepository.manager.query(
        `UPDATE icebreaker SET commentCount = commentCount - 1 WHERE id = ? AND commentCount > 0`,
        [comment.icebreakerId],
      );
      return comment;
    } catch (e) {
      this.logger.log(e);
      throw e;
    }
  }

  //! not being used.
  async remove(id: number): Promise<IcebreakerAnswer> {
    const comment = await this.findById(id);
    return await this.icebreakerCommentRepository.remove(comment);
  }

  //? ----------------------------------------------------------------------- //
  //? 모임 댓글 Flag
  //? ----------------------------------------------------------------------- //

  async createIcebreakerAnswerFlag(
    userId: number,
    icebreakerId: number,
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
          entityType: 'icebreaker_answer',
          entityId: commentId,
          message,
        }),
      );
      await queryRunner.manager.query(
        'UPDATE `icebreaker_answer` SET flagCount = flagCount + 1 WHERE id = ?',
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

  async deleteIcebreakerAnswerFlag(
    userId: number,
    commentId: number,
  ): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const { affectedRows } = await queryRunner.manager.query(
        'DELETE FROM `flag` where userId = ? AND entityType = ? AND entityId = ?',
        [userId, `icebreaker_answer`, commentId],
      );
      if (affectedRows > 0) {
        await queryRunner.manager.query(
          'UPDATE `icebreaker_answer` SET flagCount = flagCount - 1 WHERE id = ? AND flagCount > 0',
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
    icebreakerId: number,
    dto: SignedUrlDto,
  ): Promise<SignedUrl> {
    const fileUri = randomImageName(
      dto.name ?? `icebreaker_${icebreakerId}_comment`,
      dto.mimeType,
    );
    const path = `${process.env.NODE_ENV}/icebreaker_answers/${userId}/${fileUri}`;
    const url = await this.s3Service.generateSignedUrl(path);

    return {
      upload: url,
      image: `https://cdn.mesoapp.kr/${path}`,
    };
  }

  // ------------------------------------------------------------------------ //
  // Privates
  // ------------------------------------------------------------------------ //
}
