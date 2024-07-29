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
import { AnswerComment } from 'src/domain/icebreakers/entities/answer_comment.entity';
import { AnswerCommentsService } from 'src/domain/icebreakers/answer_comments.service';
import { CreateAnswerCommentDto } from 'src/domain/icebreakers/dto/create-answer_comment.dto';
import { UpdateAnswerCommentDto } from 'src/domain/icebreakers/dto/update-answer_comment.dto';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('answers')
export class AnswerAnswerCommentsController {
  constructor(private readonly answer_commentsService: AnswerCommentsService) {}

  //? ----------------------------------------------------------------------- //
  //? CREATE
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '댓글 생성' })
  @UsePipes(new ValidationPipe({ skipMissingProperties: true }))
  @Post(':answerId/answer_comments')
  async createAnswerComment(
    @CurrentUserId() userId: number,
    @Param('answerId', ParseIntPipe) answerId: number,
    @Body() dto: CreateAnswerCommentDto,
  ): Promise<any> {
    return await this.answer_commentsService.create({
      ...dto,
      userId,
      answerId,
    });
  }

  @ApiOperation({ description: '답글 등록' })
  @UsePipes(new ValidationPipe({ skipMissingProperties: true }))
  @Post(':answerId/answer_comments/:answer_commentId')
  async createReply(
    @CurrentUserId() userId: number,
    @Param('answerId') answerId: number,
    @Param('answer_commentId', ParseIntPipe) answer_commentId: number,
    @Body() dto: CreateAnswerCommentDto,
  ): Promise<any> {
    let parentId = null;
    if (answer_commentId) {
      const answer_comment = await this.answer_commentsService.findById(answer_commentId);
      parentId = answer_comment.parentId ? answer_comment.parentId : answer_commentId;
    }
    return await this.answer_commentsService.create({
      ...dto,
      userId,
      answerId,
      parentId,
    });
  }

  //? ----------------------------------------------------------------------- //
  //? READ
  //? ----------------------------------------------------------------------- //
  @ApiOperation({ description: '댓글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':answerId/answer_comments')
  async getAnswerComments(
    @Param('answerId', ParseIntPipe) answerId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<AnswerComment>> {
    const queryParams = {
      ...query,
      ...{
        filter: {
          answerId: `$eq:${answerId}`,
        },
      },
    };

    return await this.answer_commentsService.findAll(queryParams);
  }

  @ApiOperation({ description: '답글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':answerId/answer_comments/:answer_commentId')
  async getAnswerCommentsById(
    @Param('answerId', ParseIntPipe) answerId: number,
    @Param('answer_commentId', ParseIntPipe) answer_commentId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<AnswerComment>> {
    return await this.answer_commentsService.findAllById(answerId, answer_commentId, query);
  }

  //? ----------------------------------------------------------------------- //
  //? UPDATE
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '댓글 수정' })
  @Patch(':answerId/answer_comments/:answer_commentId')
  async update(
    @Param('answerId', ParseIntPipe) answerId: number,
    @Param('answer_commentId') answer_commentId: number,
    @Body() dto: UpdateAnswerCommentDto,
  ): Promise<AnswerComment> {
    return await this.answer_commentsService.update(answer_commentId, dto);
  }

  //? ----------------------------------------------------------------------- //
  //? DELETE
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '댓글 soft 삭제' })
  @Delete(':answerId/answer_comments/:answer_commentId')
  async remove(
    @Param('answerId', ParseIntPipe) answerId: number,
    @Param('answer_commentId') answer_commentId: number,
  ): Promise<AnswerComment> {
    return await this.answer_commentsService.softRemove(answer_commentId);
  }
}
