import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  paginate,
  PaginateConfig,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { CreatePostCommentDto } from 'src/domain/post-comments/dto/create-post-comment.dto';
import { UpdatePostCommentDto } from 'src/domain/post-comments/dto/update-post-comment.dto';
import { PostComment } from 'src/domain/post-comments/post-comment.entity';
import { Post } from 'src/domain/posts/post.entity';
import { User } from 'src/domain/users/user.entity';
import { truncate } from 'src/helpers/truncate';
import { FcmService } from 'src/services/fcm/fcm.service';

import { FindOneOptions, Repository } from 'typeorm';
@Injectable()
export class PostCommentsService {
  constructor(
    private readonly fcmService: FcmService,
    @InjectRepository(PostComment)
    private readonly repository: Repository<PostComment>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(dto: CreatePostCommentDto): Promise<PostComment> {
    const comment = await this.repository.create(dto);
    const result = await this.repository.save(comment);
    const post = await this.postRepository.findOne({ id: dto.postId });
    const { pushToken } = await this.userRepository.findOne({
      id: post.userId,
    });

    if (pushToken) {
      const title = truncate(post.body, 10);
      await this.fcmService.sendNotification(
        pushToken,
        `[플리옥션]`,
        `누군가 나의 포스트 "${title}" 에 댓글을 남겼습니다.`,
        {
          name: 'post',
          id: `${post.id}`,
        },
      ); // 중요하지 않은 알림의 경우 true 로 전송!
    }

    return result;
  }

  async findAll(
    id: number,
    query: PaginateQuery,
  ): Promise<Paginated<PostComment>> {
    const queryBuilder = this.repository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.children', 'children')
      .leftJoinAndSelect('children.user', 'childrenUser')
      .where('comment.post = :postId', { postId: id })
      .andWhere('comment.parentId IS NULL')
      .andWhere('childrenUser.deletedAt IS NULL')
      .andWhere('comment.deletedAt IS NULL');
    // .andWhere('comment.parentId IS NULL');

    const config: PaginateConfig<PostComment> = {
      sortableColumns: ['id'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        userId: [FilterOperator.EQ, FilterOperator.IN],
        postId: [FilterOperator.EQ, FilterOperator.IN],
      },
    };

    return await paginate<PostComment>(query, queryBuilder, config);
  }

  async findById(id: number, relations: string[] = []): Promise<PostComment> {
    return relations.length > 0
      ? await this.repository.findOneOrFail({
          where: { id },
          relations,
        })
      : await this.repository.findOneOrFail({
          where: { id },
        });
  }

  async findByUniqueKey(params: FindOneOptions): Promise<PostComment> {
    return await this.repository.findOne(params);
  }

  async update(id: number, dto: UpdatePostCommentDto): Promise<PostComment> {
    const comment = await this.repository.preload({ id, ...dto });
    if (!comment) {
      throw new NotFoundException(`comment #${id} not found`);
    }
    return await this.repository.save(comment);
  }

  async softRemove(id: number): Promise<PostComment> {
    const comment = await this.findById(id);
    return await this.repository.softRemove(comment);
  }

  async remove(id: number): Promise<PostComment> {
    const comment = await this.findById(id);
    return await this.repository.remove(comment);
  }
}
