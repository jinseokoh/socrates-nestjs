import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IncomingWebhook } from '@slack/webhook';
import {
  FilterOperator,
  paginate,
  PaginateConfig,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { InjectSlack } from 'nestjs-slack-webhook';
import { ArticleComment } from 'src/domain/article-comments/article-comment.entity';
import { CreateArticleCommentDto } from 'src/domain/article-comments/dto/create-article-comment.dto';
import { UpdateArticleCommentDto } from 'src/domain/article-comments/dto/update-article-comment.dto';
import { FindOneOptions, Repository } from 'typeorm';
import { Article } from '../articles/article.entity';
@Injectable()
export class ArticleCommentsService {
  constructor(
    @InjectSlack() private readonly slack: IncomingWebhook,
    @InjectRepository(ArticleComment)
    private readonly repository: Repository<ArticleComment>,
    @InjectRepository(Article)
    private readonly articlesRepository: Repository<Article>,
  ) {}

  async create(dto: CreateArticleCommentDto): Promise<ArticleComment> {
    const article = await this.articlesRepository.findOneOrFail({
      id: dto.articleId,
    });
    const comment = this.repository.create(dto);
    const result = await this.repository.save(comment);
    const message = `[local-test] 사용자가 ${article.title} 아티클 (#${article.id}) 에 댓글을 남겼습니다.`;
    this.slack.send(message);

    return result;
  }

  async findAll(
    id: number,
    query: PaginateQuery,
  ): Promise<Paginated<ArticleComment>> {
    const queryBuilder = this.repository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.children', 'children')
      .leftJoinAndSelect('children.user', 'childrenUser')
      .where('comment.article = :articleId', { articleId: id })
      .andWhere('comment.parentId IS NULL')
      .andWhere('childrenUser.deletedAt IS NULL')
      .andWhere('comment.deletedAt IS NULL');
    // .andWhere('comment.parentId IS NULL');

    const config: PaginateConfig<ArticleComment> = {
      sortableColumns: ['id'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        userId: [FilterOperator.EQ, FilterOperator.IN],
        articleId: [FilterOperator.EQ, FilterOperator.IN],
      },
    };

    return await paginate<ArticleComment>(query, queryBuilder, config);
  }

  async findById(
    id: number,
    relations: string[] = [],
  ): Promise<ArticleComment> {
    return relations.length > 0
      ? await this.repository.findOneOrFail({
          where: { id },
          relations,
        })
      : await this.repository.findOneOrFail({
          where: { id },
        });
  }

  async findByUniqueKey(params: FindOneOptions): Promise<ArticleComment> {
    return await this.repository.findOne(params);
  }

  async update(
    id: number,
    dto: UpdateArticleCommentDto,
  ): Promise<ArticleComment> {
    const comment = await this.repository.preload({ id, ...dto });
    if (!comment) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(comment);
  }

  async softRemove(id: number): Promise<ArticleComment> {
    const comment = await this.findById(id);
    return await this.repository.softRemove(comment);
  }

  async remove(id: number): Promise<ArticleComment> {
    const comment = await this.findById(id);
    return await this.repository.remove(comment);
  }
}
