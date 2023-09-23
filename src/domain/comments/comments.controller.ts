import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Sse,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { ApiOperation } from '@nestjs/swagger';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { Comment } from 'src/domain/comments/entities/comment.entity';
import { CommentsService } from 'src/domain/comments/comments.service';
import { CreateCommentDto } from 'src/domain/comments/dto/create-comment.dto';
import { UpdateCommentDto } from 'src/domain/comments/dto/update-comment.dto';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { IMessageEvent } from 'src/common/interfaces';
import { Observable } from 'rxjs';
import { SseService } from 'src/services/sse/sse.service';
import { EventPattern } from '@nestjs/microservices';
@UseInterceptors(ClassSerializerInterceptor)
@Controller('inquiries')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly sseService: SseService,
  ) {}

  //?-------------------------------------------------------------------------//
  //? SSE
  //?-------------------------------------------------------------------------//

  @EventPattern('sse.comments')
  handleSseComments(data: any): void {
    this.sseService.fire(data.key, data.value);
  }

  @Public()
  @Sse(':inquiryId/comments/stream')
  sse(): Observable<IMessageEvent> {
    return this.sseService.sseStream$;
  }

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '댓글 등록' })
  @UsePipes(new ValidationPipe({ skipMissingProperties: true }))
  @Post(':inquiryId/comments/:commentId?')
  async create(
    @CurrentUserId() userId: number,
    @Param('commentId') commentId: number | null,
    @Param('inquiryId') inquiryId: number,
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
      inquiryId,
      parentId,
    });
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//
  @ApiOperation({ description: '댓글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':inquiryId/comments')
  async getComments(
    @Param('inquiryId') inquiryId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Comment>> {
    return await this.commentsService.findAll(inquiryId, query);
  }

  @ApiOperation({ description: '대댓글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':inquiryId/comments/:commentId')
  async getCommentsById(
    @Param('inquiryId') inquiryId: number,
    @Param('commentId') commentId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Comment>> {
    return await this.commentsService.findAllById(inquiryId, commentId, query);
  }

  // [admin] specific logic for Report
  @ApiOperation({ description: '[관리자] 댓글 상세보기' })
  @Get('comments/:commentId')
  async getCommentById(
    @Param('commentId') commentId: number,
  ): Promise<Comment> {
    return await this.commentsService.findById(commentId, ['inquiry']);
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '댓글 수정' })
  @Patch(':inquiryId/comments/:commentId')
  async update(
    @Param('commentId') id: number,
    @Body() dto: UpdateCommentDto,
  ): Promise<Comment> {
    return await this.commentsService.update(id, dto);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '관리자) 댓글 soft 삭제' })
  @Delete(':inquiryId/comments/:commentId')
  async remove(@Param('commentId') id: number): Promise<Comment> {
    const comment = await this.commentsService.findByUniqueKey({
      where: { parentId: id },
    });
    if (comment) {
      // 대댓글이 있으면 모두 삭제
      await this.commentsService.softRemove(comment.id);
    }

    return await this.commentsService.softRemove(id);
  }
}
