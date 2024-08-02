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
import { FeedCommentUsersService } from 'src/domain/feeds/feed_comment-users.service';
import { CreateFeedCommentDto } from 'src/domain/feeds/dto/create-feed_comment.dto';
import { UpdateFeedCommentDto } from 'src/domain/feeds/dto/update-feed_comment.dto';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { Flag } from 'src/domain/users/entities/flag.entity';
import { SignedUrlDto } from 'src/domain/users/dto/signed-url.dto';
import { SignedUrl } from 'src/common/types';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('feeds')
export class FeedCommentUsersController {
  constructor(
    private readonly feedCommentUsersService: FeedCommentUsersService,
  ) {}

  //? ----------------------------------------------------------------------- //
  //? Feed 댓글 생성
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '댓글 생성' })
  @UsePipes(new ValidationPipe({ skipMissingProperties: true }))
  @Post(':feedId/comments')
  async createFeedComment(
    @CurrentUserId() userId: number,
    @Param('feedId', ParseIntPipe) feedId: number,
    @Body() dto: CreateFeedCommentDto,
  ): Promise<FeedComment> {
    let parentId = null;
    if (dto.commentId) {
      const comment = await this.feedCommentUsersService.findById(
        dto.commentId,
      );
      parentId = comment.parentId ? comment.parentId : dto.commentId;
    }

    return await this.feedCommentUsersService.create({
      ...dto,
      userId,
      feedId,
      parentId,
      sendNotification: dto.sendNotification ?? false,
    });
  }

  //? ----------------------------------------------------------------------- //
  //? Feed 댓글 리스트
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '댓글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':feedId/comments')
  async findAllInTraditionalStyle(
    @Param('feedId', ParseIntPipe) feedId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<FeedComment>> {
    const result = await this.feedCommentUsersService.findAllInTraditionalStyle(
      query,
      feedId,
    );

    return result;
    // recursive tree 인 경우.
    // return {
    //   ...result,
    //   data: result.data.map((comment) =>
    //     this.feedCommentUsersService.buildFeedCommentTree(comment),
    //   ),
    // };
  }

  @ApiOperation({ description: '댓글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':feedId/comments_counts')
  async findAllInYoutubeStyle(
    @Param('feedId', ParseIntPipe) feedId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<FeedComment>> {
    const result = await this.feedCommentUsersService.findAllInYoutubeStyle(
      query,
      feedId,
    );

    return result;
  }

  //? 답글 리스트, 최상단 부모는 리턴되지 않음.
  @ApiOperation({ description: '답글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':feedId/comments/:commentId')
  async findFeedCommentRepliesById(
    @Param('feedId', ParseIntPipe) feedId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<FeedComment>> {
    return await this.feedCommentUsersService.findAllRepliesById(
      query,
      feedId,
      commentId,
    );
  }

  //? ----------------------------------------------------------------------- //
  //? Feed 댓글 update
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '댓글 수정' })
  @Patch(':feedId/comments/:commentId')
  async update(
    @Param('feedId', ParseIntPipe) feedId: number,
    @Param('commentId') commentId: number,
    @Body() dto: UpdateFeedCommentDto,
  ): Promise<FeedComment> {
    return await this.feedCommentUsersService.update(commentId, dto);
  }

  //? ----------------------------------------------------------------------- //
  //? Feed 댓글 delete
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '댓글 soft 삭제' })
  @Delete(':feedId/comments/:commentId')
  async remove(
    @Param('feedId', ParseIntPipe) feedId: number,
    @Param('commentId') commentId: number,
  ): Promise<FeedComment> {
    return await this.feedCommentUsersService.softRemove(commentId);
  }

  //? ----------------------------------------------------------------------- //
  //? Feed 댓글 Flag
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'flag 댓글/답글' })
  @Post(':feedId/comments/:commentId/flag')
  async createFeedCommentFlag(
    @CurrentUserId() userId: number,
    @Param('feedId', ParseIntPipe) feedId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body('message') message: string,
  ): Promise<Flag> {
    return await this.feedCommentUsersService.createFeedCommentFlag(
      userId,
      feedId,
      commentId,
      message,
    );
  }

  @ApiOperation({ description: 'flag 댓글/답글' })
  @Delete(':feedId/comments/:commentId/flag')
  async deleteFeedCommentFlag(
    @CurrentUserId() userId: number,
    @Param('feedId', ParseIntPipe) feedId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
  ): Promise<Flag> {
    return await this.feedCommentUsersService.deleteFeedCommentFlag(
      userId,
      commentId,
    );
  }

  @ApiOperation({ description: 's3 직접 업로드를 위한 signedUrl 리턴' })
  @Post(':feedId/comments/upload-url')
  async getSignedUrl(
    @CurrentUserId() userId: number,
    @Param('feedId', ParseIntPipe) feedId: number,
    @Body() dto: SignedUrlDto,
  ): Promise<SignedUrl> {
    return await this.feedCommentUsersService.getSignedUrl(
      userId,
      feedId,
      dto,
    );
  }
}
