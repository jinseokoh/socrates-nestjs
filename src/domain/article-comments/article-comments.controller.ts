import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { ArticleComment } from 'src/domain/article-comments/article-comment.entity';
import { ArticleCommentsService } from 'src/domain/article-comments/article-comments.service';
import { CreateArticleCommentDto } from 'src/domain/article-comments/dto/create-article-comment.dto';
import { UpdateArticleCommentDto } from 'src/domain/article-comments/dto/update-article-comment.dto';
import { ArticlesService } from 'src/domain/articles/articles.service';
@UseInterceptors(ClassSerializerInterceptor)
@Controller('articles')
export class ArticleCommentsController {
  constructor(
    private readonly articlesService: ArticlesService,
    private readonly articleCommentsService: ArticleCommentsService,
  ) {}

  @ApiOperation({ description: '댓글 등록' })
  @UsePipes(new ValidationPipe({ skipMissingProperties: true }))
  @Post(':articleId/comments/:commentId?')
  async create(
    @CurrentUserId() userId: number,
    @Param('articleId') articleId: number,
    @Param('commentId') commentId: number | null,
    @Body() dto: CreateArticleCommentDto,
  ): Promise<any> {
    await this.articlesService.findById(articleId);
    if (commentId) {
      await this.articleCommentsService.findById(commentId);
    }

    return await this.articleCommentsService.create({
      ...dto,
      userId,
      articleId,
      parentId: commentId ? commentId : null,
    });
  }

  @ApiOperation({ description: '댓글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':articleId/comments')
  async getArticleComments(
    @Param('articleId') articleId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<ArticleComment>> {
    await this.articlesService.findById(articleId);
    return await this.articleCommentsService.findAll(articleId, query);
  }

  @ApiOperation({ description: '댓글 상세보기' })
  @Get(':articleId/comments/:commentId')
  async getArticleCommentById(
    @Param('commentId') id: number,
  ): Promise<ArticleComment> {
    return await this.articleCommentsService.findById(id, [
      'parent',
      'parent.user',
    ]);
  }

  @ApiOperation({ description: '댓글 수정' })
  @Patch(':articleId/comments/:commentId')
  async update(
    @Param('commentId') id: number,
    @Body() dto: UpdateArticleCommentDto,
  ): Promise<ArticleComment> {
    return await this.articleCommentsService.update(id, dto);
  }

  @ApiOperation({ description: '관리자) 댓글 soft 삭제' })
  @Delete(':articleId/comments/:commentId')
  async remove(@Param('commentId') id: number): Promise<ArticleComment> {
    const comment = await this.articleCommentsService.findByUniqueKey({
      where: { parentId: id },
    });
    if (comment) {
      // 대댓글이 있으면 자동삭제하시오.
      await this.articleCommentsService.softRemove(comment.id);
    }

    return await this.articleCommentsService.softRemove(id);
  }
}
