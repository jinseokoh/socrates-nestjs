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
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { CreateMeetupCommentDto } from 'src/domain/meetups/dto/create-meetup_comment.dto';
import { UpdateMeetupCommentDto } from 'src/domain/meetups/dto/update-meetup_comment.dto';
import { MeetupComment } from 'src/domain/meetups/entities/meetup_comment.entity';
import { MeetupCommentsService } from 'src/domain/meetups/meetup-comments.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('meetups')
export class MeetupCommentsController {
  constructor(private readonly meetup_commentsService: MeetupCommentsService) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '댓글 생성' })
  @Post(':meetupId/meetup_comments')
  async createMeetupComment(
    @CurrentUserId() userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Body() dto: CreateMeetupCommentDto,
  ): Promise<MeetupComment> {
    return await this.meetup_commentsService.create({
      ...dto,
      userId,
      meetupId,
    });
  }

  @ApiOperation({ description: '답글 등록' })
  @UsePipes(new ValidationPipe({ skipMissingProperties: true }))
  @Post(':meetupId/meetup_comments/:meetup_commentId')
  async createReply(
    @CurrentUserId() userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Param('meetup_commentId', ParseIntPipe) meetup_commentId: number,
    @Body() dto: CreateMeetupCommentDto,
  ): Promise<any> {
    let parentId = null;
    if (meetup_commentId) {
      const meetup_comment =
        await this.meetup_commentsService.findById(meetup_commentId);
      parentId = meetup_comment.parentId
        ? meetup_comment.parentId
        : meetup_commentId;
    }
    return await this.meetup_commentsService.create({
      ...dto,
      userId,
      meetupId,
      parentId,
    });
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  //? 댓글리스트, 답글은 sorting 되지 않고 id 역순으로 나열
  @ApiOperation({ description: '댓글(Q) 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':meetupId/meetup_comments')
  async getMeetupComments(
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<MeetupComment>> {
    const queryParams = {
      ...query,
      ...{
        filter: {
          meetupId: `$eq:${meetupId}`,
        },
      },
    };

    return await this.meetup_commentsService.findAll(queryParams);
  }

  //? 답글 리스트, 최상단 부모는 리턴되지 않음.
  @ApiOperation({ description: '답글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':meetupId/meetup_comments/:meetup_commentId')
  async getMeetupCommentRepliesById(
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Param('meetup_commentId', ParseIntPipe) meetup_commentId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<MeetupComment>> {
    return await this.meetup_commentsService.findAllById(
      meetupId,
      meetup_commentId,
      query,
    );
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '댓글 수정' })
  @Patch(':meetupId/meetup_comments/:meetup_commentId')
  async update(
    // @CurrentUserId() userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Param('meetup_commentId', ParseIntPipe) meetup_commentId: number,
    @Body() dto: UpdateMeetupCommentDto,
  ): Promise<MeetupComment> {
    return await this.meetup_commentsService.update(meetup_commentId, dto);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '댓글 soft 삭제' })
  @Delete(':meetupId/meetup_comments/:meetup_commentId')
  async remove(
    // @CurrentUserId() userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Param('meetup_commentId', ParseIntPipe) meetup_commentId: number,
  ): Promise<MeetupComment> {
    return await this.meetup_commentsService.softRemove(meetup_commentId);
  }
}
