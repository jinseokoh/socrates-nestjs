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
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { ApiOperation } from '@nestjs/swagger';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { Comment } from 'src/domain/feeds/entities/comment.entity';
import { FeedCommentsService } from 'src/domain/feeds/feed-comments.service';
import { CreateCommentDto } from 'src/domain/feeds/dto/create-comment.dto';
import { UpdateCommentDto } from 'src/domain/feeds/dto/update-comment.dto';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('feeds')
export class FeedCommentsController {
  constructor(private readonly feedCommentsService: FeedCommentsService) {}

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
    return await this.feedCommentsService.create({
      ...dto,
      userId,
      feedId,
      sendNotification: dto.sendNotification ?? false,
    });
  }

  @ApiOperation({ description: '답글 생성' })
  @UsePipes(new ValidationPipe({ skipMissingProperties: true }))
  @Post(':feedId/comments/:commentId')
  async createCommentReply(
    @CurrentUserId() userId: number,
    @Param('feedId', ParseIntPipe) feedId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() dto: CreateCommentDto,
  ): Promise<any> {
    const comment = await this.feedCommentsService.findById(commentId);
    const parentId = comment.parentId ? comment.parentId : commentId;

    return await this.feedCommentsService.create({
      ...dto,
      userId,
      feedId,
      parentId,
      sendNotification: dto.sendNotification ?? false,
    });
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//
  @ApiOperation({ description: '댓글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':feedId/comments')
  async findAllInTraditionalStyle(
    @Param('feedId', ParseIntPipe) feedId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Comment>> {
    const result = await this.feedCommentsService.findAllInTraditionalStyle(
      query,
      feedId,
    );

    return result;
    // recursive tree 인 경우.
    // return {
    //   ...result,
    //   data: result.data.map((comment) =>
    //     this.feedCommentsService.buildCommentTree(comment),
    //   ),
    // };
  }

  @ApiOperation({ description: '댓글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':feedId/comments-count')
  async findAllInYoutubeStyle(
    @Param('feedId', ParseIntPipe) feedId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Comment>> {
    const result = await this.feedCommentsService.findAllInYoutubeStyle(
      query,
      feedId,
    );

    return result;
  }

  @ApiOperation({ description: '답글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':feedId/comments/:commentId')
  async findAllRepliesById(
    @Param('feedId', ParseIntPipe) feedId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Comment>> {
    return await this.feedCommentsService.findAllRepliesById(
      query,
      feedId,
      commentId,
    );
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
    return await this.feedCommentsService.update(dto, commentId);
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
    return await this.feedCommentsService.softRemove(commentId);
  }
}
