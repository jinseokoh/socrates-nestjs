import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Sse,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { ApiOperation } from '@nestjs/swagger';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { Comment } from 'src/domain/feeds/entities/comment.entity';
import { CommentsService } from 'src/domain/feeds/comments.service';
import { CreateCommentDto } from 'src/domain/feeds/dto/create-comment.dto';
import { UpdateCommentDto } from 'src/domain/feeds/dto/update-comment.dto';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('feeds')
export class FeedCommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '댓글 생성' })
  @UsePipes(new ValidationPipe({ skipMissingProperties: true }))
  @Post(':feedId/comments')
  async createComment(
    @CurrentUserId() userId: number,
    @Param('feedId', ParseIntPipe) feedId: number,
    @Body() dto: CreateCommentDto,
  ): Promise<any> {
    return await this.commentsService.create({
      ...dto,
      userId,
      feedId,
    });
  }

  @ApiOperation({ description: '답글 등록' })
  @UsePipes(new ValidationPipe({ skipMissingProperties: true }))
  @Post(':feedId/comments/:commentId')
  async createReply(
    @CurrentUserId() userId: number,
    @Param('feedId') feedId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() dto: CreateCommentDto,
  ): Promise<any> {
    let parentId = null;
    if (commentId) {
      const comment = await this.commentsService.findById(commentId);
      parentId = comment.parentId ? comment.parentId : commentId;
    }
    return await this.commentsService.create({
      ...dto,
      userId,
      feedId,
      parentId,
    });
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//
  @ApiOperation({ description: '댓글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':feedId/comments')
  async getComments(
    @Param('feedId', ParseIntPipe) feedId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Comment>> {
    const queryParams = {
      ...query,
      ...{
        filter: {
          feedId: `$eq:${feedId}`,
        },
      },
    };

    return await this.commentsService.findAll(queryParams);
  }

  @ApiOperation({ description: '답글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':feedId/comments/:commentId')
  async getCommentsById(
    @Param('feedId', ParseIntPipe) feedId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Comment>> {
    return await this.commentsService.findAllById(feedId, commentId, query);
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '댓글 수정' })
  @Patch(':feedId/comments/:commentId')
  async update(
    @Param('feedId', ParseIntPipe) feedId: number,
    @Param('commentId') commentId: number,
    @Body() dto: UpdateCommentDto,
  ): Promise<Comment> {
    return await this.commentsService.update(commentId, dto);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '댓글 soft 삭제' })
  @Delete(':feedId/comments/:commentId')
  async remove(
    @Param('feedId', ParseIntPipe) feedId: number,
    @Param('commentId') commentId: number,
  ): Promise<Comment> {
    return await this.commentsService.softRemove(commentId);
  }
}
