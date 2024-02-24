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
import { Comment } from 'src/domain/inquiries/entities/comment.entity';
import { CommentsService } from 'src/domain/inquiries/comments.service';
import { CreateCommentDto } from 'src/domain/inquiries/dto/create-comment.dto';
import { UpdateCommentDto } from 'src/domain/inquiries/dto/update-comment.dto';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('inquiries')
export class InquiryCommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '댓글 등록' })
  @UsePipes(new ValidationPipe({ skipMissingProperties: true }))
  @Post(':inquiryId/comments')
  async create(
    @CurrentUserId() userId: number,
    @Param('inquiryId') inquiryId: number,
    @Body() dto: CreateCommentDto,
  ): Promise<any> {
    return await this.commentsService.create({
      ...dto,
      userId,
      inquiryId,
    });
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//
  @ApiOperation({ description: '댓글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':inquiryId/comments')
  async getComments(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Comment>> {
    const queryParams = {
      ...query,
      ...{
        filter: {
          inquiryId: `$eq:${inquiryId}`,
        },
      },
    };
    return await this.commentsService.findAll(queryParams);
  }

  @ApiOperation({ description: '답글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':inquiryId/comments/:commentId')
  async getCommentsById(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Comment>> {
    return await this.commentsService.findAllById(inquiryId, commentId, query);
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
  async remove(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Param('commentId') id: number,
  ): Promise<Comment> {
    return await this.commentsService.softRemove(id);
  }
}
