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
  constructor(private readonly meetupCommentsService: MeetupCommentsService) {}

  //? ----------------------------------------------------------------------- //
  //? CREATE
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '댓글 생성' })
  @Post(':meetupId/comments')
  async createMeetupComment(
    @CurrentUserId() userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Body() dto: CreateMeetupCommentDto,
  ): Promise<MeetupComment> {
    return await this.meetupCommentsService.create({
      ...dto,
      userId,
      meetupId,
      sendNotification: dto.sendNotification ?? false,
    });
  }

  @ApiOperation({ description: '답글 생성' })
  @UsePipes(new ValidationPipe({ skipMissingProperties: true }))
  @Post(':meetupId/comments/:commentId')
  async createMeetupCommentReply(
    @CurrentUserId() userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() dto: CreateMeetupCommentDto,
  ): Promise<any> {
    let parentId = null;
    if (commentId) {
      const comment = await this.meetupCommentsService.findById(commentId);
      parentId = comment.parentId ? comment.parentId : commentId;
    }
    return await this.meetupCommentsService.create({
      ...dto,
      userId,
      meetupId,
      parentId,
      sendNotification: dto.sendNotification ?? false,
    });
  }

  //? ----------------------------------------------------------------------- //
  //? READ
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '댓글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':meetupId/comments')
  async findAllInTraditionalStyle(
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<MeetupComment>> {
    const result = await this.meetupCommentsService.findAllInTraditionalStyle(
      query,
      meetupId,
    );

    return result;
    // recursive tree 인 경우.
    // return {
    //   ...result,
    //   data: result.data.map((comment) =>
    //     this.meetupCommentsService.buildMeetupCommentTree(comment),
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
    const result = await this.meetupCommentsService.findAllInYoutubeStyle(
      query,
      meetupId,
    );

    return result;
  }

  //? 답글 리스트, 최상단 부모는 리턴되지 않음.
  @ApiOperation({ description: '답글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':meetupId/comments/:commentId')
  async getMeetupCommentRepliesById(
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<MeetupComment>> {
    return await this.meetupCommentsService.findAllRepliesById(
      query,
      meetupId,
      commentId,
    );
  }

  //? ----------------------------------------------------------------------- //
  //? UPDATE
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '댓글 수정' })
  @Patch(':meetupId/comments/:commentId')
  async update(
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() dto: UpdateMeetupCommentDto,
  ): Promise<MeetupComment> {
    return await this.meetupCommentsService.update(dto, commentId);
  }

  //? ----------------------------------------------------------------------- //
  //? DELETE
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '댓글 soft 삭제' })
  @Delete(':meetupId/comments/:commentId')
  async remove(
    // @CurrentUserId() userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
  ): Promise<MeetupComment> {
    return await this.meetupCommentsService.softRemove(commentId);
  }
}
