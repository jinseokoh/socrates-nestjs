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
import { CreatePostCommentDto } from 'src/domain/post-comments/dto/create-post-comment.dto';
import { UpdatePostCommentDto } from 'src/domain/post-comments/dto/update-post-comment.dto';
import { PostComment } from 'src/domain/post-comments/post-comment.entity';
import { PostCommentsService } from 'src/domain/post-comments/post-comments.service';
import { PostsService } from 'src/domain/posts/posts.service';
@UseInterceptors(ClassSerializerInterceptor)
@Controller('posts')
export class PostCommentsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly postCommentsService: PostCommentsService,
  ) {}

  @ApiOperation({ description: '댓글 등록' })
  @UsePipes(new ValidationPipe({ skipMissingProperties: true }))
  @Post(':postId/comments/:commentId?')
  async create(
    @CurrentUserId() userId: number,
    @Param('postId') postId: number,
    @Param('commentId') commentId: number | null,
    @Body() dto: CreatePostCommentDto,
  ): Promise<any> {
    await this.postsService.findById(postId);
    if (commentId) {
      await this.postCommentsService.findById(commentId);
    }
    return await this.postCommentsService.create({
      ...dto,
      userId,
      postId,
      parentId: commentId ? commentId : null,
    });
  }

  @ApiOperation({ description: '댓글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':postId/comments')
  async getPostComments(
    @Param('postId') postId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<PostComment>> {
    await this.postsService.findById(postId);
    return await this.postCommentsService.findAll(postId, query);
  }

  @ApiOperation({ description: '댓글 상세보기' })
  @Get(':postId/comments/:commentId')
  async getPostCommentById(
    @Param('commentId') id: number,
  ): Promise<PostComment> {
    return await this.postCommentsService.findById(id, [
      'parent',
      'parent.user',
    ]);
  }

  @ApiOperation({ description: '댓글 수정' })
  @Patch(':postId/comments/:commentId')
  async update(
    @Param('commentId') id: number,
    @Body() dto: UpdatePostCommentDto,
  ): Promise<PostComment> {
    return await this.postCommentsService.update(id, dto);
  }

  @ApiOperation({ description: '관리자) 댓글 soft 삭제' })
  @Delete(':postId/comments/:commentId')
  async remove(@Param('commentId') id: number): Promise<PostComment> {
    const comment = await this.postCommentsService.findByUniqueKey({
      where: { parentId: id },
    });
    if (comment) {
      // 대댓글이 있으면 자동삭제하시오.
      await this.postCommentsService.softRemove(comment.id);
    }

    return await this.postCommentsService.softRemove(id);
  }
}
