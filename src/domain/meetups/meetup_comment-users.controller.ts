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
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { SignedUrl } from 'src/common/types';
import { CreateMeetupCommentDto } from 'src/domain/meetups/dto/create-meetup_comment.dto';
import { UpdateMeetupCommentDto } from 'src/domain/meetups/dto/update-meetup_comment.dto';
import { MeetupComment } from 'src/domain/meetups/entities/meetup_comment.entity';
import { MeetupCommentUsersService } from 'src/domain/meetups/meetup_comment-users.service';
import { SignedUrlDto } from 'src/domain/users/dto/signed-url.dto';
import { Flag } from 'src/domain/users/entities/flag.entity';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('meetups')
export class MeetupCommentUsersController {
  constructor(
    private readonly meetupCommentUsersService: MeetupCommentUsersService,
  ) {}

  //? ----------------------------------------------------------------------- //
  //? 모임 댓글 생성
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '댓글 생성' })
  @Post(':meetupId/comments')
  async createMeetupComment(
    @CurrentUserId() userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Body() dto: CreateMeetupCommentDto,
  ): Promise<MeetupComment> {
    let parentId = null;
    if (dto.commentId) {
      const comment = await this.meetupCommentUsersService.findById(
        dto.commentId,
      );
      parentId = comment.parentId ? comment.parentId : dto.commentId;
    }

    return await this.meetupCommentUsersService.create({
      ...dto,
      userId,
      meetupId,
      parentId,
      sendNotification: dto.sendNotification ?? false,
    });
  }

  //? ----------------------------------------------------------------------- //
  //? 모임 댓글 리스트
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '댓글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':meetupId/comments')
  async findAllInTraditionalStyle(
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<MeetupComment>> {
    const result =
      await this.meetupCommentUsersService.findAllInTraditionalStyle(
        query,
        meetupId,
      );

    return result;
    // recursive tree 인 경우.
    // return {
    //   ...result,
    //   data: result.data.map((comment) =>
    //     this.meetupCommentUsersService.buildMeetupCommentTree(comment),
    //   ),
    // };
  }

  @ApiOperation({ description: '댓글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':meetupId/comments_counts')
  async findAllInYoutubeStyle(
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<MeetupComment>> {
    const result = await this.meetupCommentUsersService.findAllInYoutubeStyle(
      query,
      meetupId,
    );

    return result;
  }

  //? 답글 리스트, 최상단 부모는 리턴되지 않음.
  @ApiOperation({ description: '답글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':meetupId/comments/:commentId')
  async findMeetupCommentRepliesById(
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<MeetupComment>> {
    return await this.meetupCommentUsersService.findAllRepliesById(
      query,
      meetupId,
      commentId,
    );
  }

  //? ----------------------------------------------------------------------- //
  //? 모임 댓글 update
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '댓글 수정' })
  @Patch(':meetupId/comments/:commentId')
  async updateMeetupComment(
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() dto: UpdateMeetupCommentDto,
  ): Promise<MeetupComment> {
    return await this.meetupCommentUsersService.update(commentId, dto);
  }

  //? ----------------------------------------------------------------------- //
  //? 모임 댓글 delete
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '댓글 soft 삭제' })
  @Delete(':meetupId/comments/:commentId')
  async deleteMeetupComment(
    // @CurrentUserId() userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
  ): Promise<MeetupComment> {
    return await this.meetupCommentUsersService.softRemove(commentId);
  }

  //? ----------------------------------------------------------------------- //
  //? 모임 댓글 Flag
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'add flag 댓글/답글' })
  @Post(':meetupId/comments/:commentId/flag')
  async createMeetupCommentFlag(
    @CurrentUserId() userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body('message') message: string,
  ): Promise<Flag> {
    return await this.meetupCommentUsersService.createMeetupCommentFlag(
      userId,
      meetupId,
      commentId,
      message,
    );
  }

  @ApiOperation({ description: 'delete flag 댓글/답글' })
  @Delete(':meetupId/comments/:commentId/flag')
  async deleteMeetupCommentFlag(
    @CurrentUserId() userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
  ): Promise<Flag> {
    return await this.meetupCommentUsersService.deleteMeetupCommentFlag(
      userId,
      commentId,
    );
  }

  //? ----------------------------------------------------------------------- //
  //? S3 Upload
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 's3 직접 업로드를 위한 signedUrl 리턴' })
  @Post(':meetupId/comments/upload-url')
  async getSignedUrl(
    @CurrentUserId() userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Body() dto: SignedUrlDto,
  ): Promise<SignedUrl> {
    return await this.meetupCommentUsersService.getSignedUrl(
      userId,
      meetupId,
      dto,
    );
  }
}
