import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  PaginateConfig,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { IsNull, Repository } from 'typeorm';
import { Content } from 'src/domain/contents/entities/content.entity';
import { ContentComment } from 'src/domain/contents/entities/content_comment.entity';
import { CreateContentCommentDto } from 'src/domain/contents/dto/create-content_comment.dto';
import { UpdateContentCommentDto } from 'src/domain/contents/dto/update-content_comment.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomImageName } from 'src/helpers/random-filename';
import { SignedUrlDto } from 'src/domain/users/dto/signed-url.dto';
import { SignedUrl } from 'src/common/types';
import { S3Service } from 'src/services/aws/s3.service';

@Injectable()
export class ContentCommentUsersService {
  private readonly logger = new Logger(ContentCommentUsersService.name);

  constructor(
    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,
    @InjectRepository(ContentComment)
    private readonly contentCommentRepository: Repository<ContentComment>,
    private readonly s3Service: S3Service,
    private eventEmitter: EventEmitter2,
  ) {}

  //? ----------------------------------------------------------------------- //
  //? CREATE
  //? ----------------------------------------------------------------------- //

  // 작성자가 없으므로 notification 로직은 제외
  async create(dto: CreateContentCommentDto): Promise<ContentComment> {
    // creation
    const comment = await this.contentCommentRepository.save(
      this.contentCommentRepository.create(dto),
    );
    await this.contentRepository.increment(
      { id: dto.contentId },
      `commentCount`,
      1,
    );

    return comment;
  }

  //? ----------------------------------------------------------------------- //
  //? READ
  //? ----------------------------------------------------------------------- //

  //? comments w/ replies (children)
  async findAllInTraditionalStyle(
    query: PaginateQuery,
    contentId: number,
  ): Promise<Paginated<ContentComment>> {
    return paginate(query, this.contentCommentRepository, {
      where: {
        contentId: contentId,
        parentId: IsNull(),
      },
      relations: ['user', 'children', 'children.user'],
      sortableColumns: ['createdAt'],
      defaultSortBy: [['createdAt', 'DESC']],
      defaultLimit: 20,
    });
    // return await paginate<ContentComment>(query, queryBuilder, config);
  }

  //? comments w/ replyCount
  async findAllInYoutubeStyle(
    query: PaginateQuery,
    contentId: number,
  ): Promise<Paginated<ContentComment>> {
    const queryBuilder = this.contentCommentRepository
      .createQueryBuilder('comment')
      .innerJoinAndSelect('comment.user', 'user')
      .loadRelationCountAndMap('comment.replyCount', 'comment.children')
      .where('comment.parentId IS NULL')
      .andWhere('comment.contentId = :contentId', { contentId });

    const config: PaginateConfig<ContentComment> = {
      sortableColumns: ['id'],
      searchableColumns: ['body'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        contentId: [FilterOperator.EQ],
        isFlagged: [FilterOperator.EQ],
      },
    };

    return await paginate<ContentComment>(query, queryBuilder, config);
  }

  // 답글 리스트
  async findAllRepliesById(
    query: PaginateQuery,
    contentId: number,
    commentId: number,
  ): Promise<Paginated<ContentComment>> {
    const queryBuilder = this.contentCommentRepository
      .createQueryBuilder('comment')
      .innerJoinAndSelect('comment.user', 'user')
      .where('comment.contentId = :contentId', { contentId })
      .andWhere('comment.parentId = :commentId', { commentId })
      .andWhere('comment.deletedAt IS NULL');

    const config: PaginateConfig<ContentComment> = {
      sortableColumns: ['id'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'ASC']],
      filterableColumns: {
        isFlagged: [FilterOperator.EQ],
      },
    };

    return await paginate<ContentComment>(query, queryBuilder, config);
  }

  async findById(
    id: number,
    relations: string[] = [],
  ): Promise<ContentComment> {
    try {
      return relations.length > 0
        ? await this.contentCommentRepository.findOneOrFail({
            where: { id },
            relations,
          })
        : await this.contentCommentRepository.findOneOrFail({
            where: { id },
          });
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }

  //? ----------------------------------------------------------------------- //
  //? content 댓글 update
  //? ----------------------------------------------------------------------- //

  async update(
    commentId: number,
    dto: UpdateContentCommentDto,
  ): Promise<ContentComment> {
    const comment = await this.contentCommentRepository.preload({
      id: commentId,
      ...dto,
    });
    // user validation here might be a good option to be added
    if (!comment) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.contentCommentRepository.save(comment);
  }

  //? ----------------------------------------------------------------------- //
  //? content 댓글 delete
  //? ----------------------------------------------------------------------- //

  async softRemove(id: number): Promise<ContentComment> {
    try {
      const comment = await this.findById(id);
      await this.contentCommentRepository.softRemove(comment);
      await this.contentRepository.manager.query(
        `UPDATE content SET commentCount = commentCount - 1 WHERE id = ? AND commentCount > 0`,
        [comment.contentId],
      );
      return comment;
    } catch (e) {
      this.logger.log(e);
      throw e;
    }
  }

  //! not being used.
  async remove(id: number): Promise<ContentComment> {
    const comment = await this.findById(id);
    return await this.contentCommentRepository.remove(comment);
  }

  //! not being used) recursive tree 구조일 경우 사용.
  public buildContentCommentTree(comment: ContentComment): ContentComment {
    if (comment.children) {
      comment.children = comment.children.map((child) =>
        this.buildContentCommentTree(child),
      );
    }
    return comment;
  }

  //? ----------------------------------------------------------------------- //
  //? UPLOAD
  //? ----------------------------------------------------------------------- //

  // S3 직접 업로드를 위한 signedUrl 리턴
  async getSignedUrl(
    userId: number,
    contentId: number,
    dto: SignedUrlDto,
  ): Promise<SignedUrl> {
    const fileUri = randomImageName(
      dto.name ?? `content_${contentId}_comment`,
      dto.mimeType,
    );
    const path = `${process.env.NODE_ENV}/content_comments/${userId}/${fileUri}`;
    const url = await this.s3Service.generateSignedUrl(path);

    return {
      upload: url,
      image: `https://cdn.mesoapp.kr/${path}`,
    };
  }
}
