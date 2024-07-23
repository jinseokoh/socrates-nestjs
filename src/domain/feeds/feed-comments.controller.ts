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
import { FeedComment } from 'src/domain/feeds/entities/feed_comment.entity';
import { FeedCommentsService } from 'src/domain/feeds/feed-comments.service';
import { CreateFeedCommentDto } from 'src/domain/feeds/dto/create-comment.dto';
import { UpdateFeedCommentDto } from 'src/domain/feeds/dto/update-comment.dto';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('feeds')
export class FeedCommentsController {
  constructor(private readonly feedFeedCommentsService: FeedCommentsService) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '댓글 생성' })
  @UsePipes(new ValidationPipe({ skipMissingProperties: true }))
  @Post(':feedId/feed_comments')
  async createFeedComment(
    @CurrentUserId() userId: number,
    @Param('feedId', ParseIntPipe) feedId: number,
    @Body() dto: CreateFeedCommentDto,
  ): Promise<any> {
    return await this.feedFeedCommentsService.create({
      ...dto,
      userId,
      feedId,
      sendNotification: dto.sendNotification ?? false,
    });
  }

  @ApiOperation({ description: '답글 생성' })
  @UsePipes(new ValidationPipe({ skipMissingProperties: true }))
  @Post(':feedId/feed_comments/:commentId')
  async createFeedCommentReply(
    @CurrentUserId() userId: number,
    @Param('feedId', ParseIntPipe) feedId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() dto: CreateFeedCommentDto,
  ): Promise<any> {
    const comment = await this.feedFeedCommentsService.findById(commentId);
    const parentId = comment.parentId ? comment.parentId : commentId;

    return await this.feedFeedCommentsService.create({
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
  @Get(':feedId/feed_comments')
  async findAllInTraditionalStyle(
    @Param('feedId', ParseIntPipe) feedId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<FeedComment>> {
    const result = await this.feedFeedCommentsService.findAllInTraditionalStyle(
      query,
      feedId,
    );

    return result;
    // recursive tree 인 경우.
    // return {
    //   ...result,
    //   data: result.data.map((comment) =>
    //     this.feedFeedCommentsService.buildFeedCommentTree(comment),
    //   ),
    // };
  }

  @ApiOperation({ description: '댓글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':feedId/feed_comments-count')
  async findAllInYoutubeStyle(
    @Param('feedId', ParseIntPipe) feedId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<FeedComment>> {
    const result = await this.feedFeedCommentsService.findAllInYoutubeStyle(
      query,
      feedId,
    );

    return result;
  }

  @ApiOperation({ description: '답글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':feedId/feed_comments/:commentId')
  async findAllRepliesById(
    @Param('feedId', ParseIntPipe) feedId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<FeedComment>> {
    return await this.feedFeedCommentsService.findAllRepliesById(
      query,
      feedId,
      commentId,
    );
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '댓글 수정' })
  @Patch(':feedId/feed_comments/:commentId')
  async update(
    @Param('feedId', ParseIntPipe) feedId: number,
    @Param('commentId') commentId: number,
    @Body() dto: UpdateFeedCommentDto,
  ): Promise<FeedComment> {
    return await this.feedFeedCommentsService.update(dto, commentId);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '댓글 soft 삭제' })
  @Delete(':feedId/feed_comments/:commentId')
  async remove(
    @Param('feedId', ParseIntPipe) feedId: number,
    @Param('commentId') commentId: number,
  ): Promise<FeedComment> {
    return await this.feedFeedCommentsService.softRemove(commentId);
  }
}
