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
import { InquiryComment } from 'src/domain/inquiries/entities/inquiry_comment.entity';
import { InquiryCommentsService } from 'src/domain/inquiries/inquiry-comments.service';
import { CreateInquiryCommentDto } from 'src/domain/inquiries/dto/create-inquiry_comment.dto';
import { UpdateInquiryCommentDto } from 'src/domain/inquiries/dto/update-inquiry_comment.dto';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('inquiries')
export class InquiryCommentsController {
  constructor(
    private readonly inquiryCommentsService: InquiryCommentsService,
  ) {}

  //? ----------------------------------------------------------------------- //
  //? CREATE
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '댓글 생성' })
  @UsePipes(new ValidationPipe({ skipMissingProperties: true }))
  @Post(':inquiryId/comments')
  async createInquiryComment(
    @CurrentUserId() userId: number,
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Body() dto: CreateInquiryCommentDto,
  ): Promise<any> {
    return await this.inquiryCommentsService.create({
      ...dto,
      userId,
      inquiryId,
      sendNotification: dto.sendNotification ?? false,
    });
  }

  @ApiOperation({ description: '답글 생성' })
  @UsePipes(new ValidationPipe({ skipMissingProperties: true }))
  @Post(':inquiryId/comments/:commentId')
  async createinquiryCommentReply(
    @CurrentUserId() userId: number,
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() dto: CreateInquiryCommentDto,
  ): Promise<any> {
    const comment = await this.inquiryCommentsService.findById(commentId);
    const parentId = comment.parentId ? comment.parentId : commentId;

    return await this.inquiryCommentsService.create({
      ...dto,
      userId,
      inquiryId,
      parentId,
      sendNotification: dto.sendNotification ?? false,
    });
  }

  //? ----------------------------------------------------------------------- //
  //? READ
  //? ----------------------------------------------------------------------- //
  @ApiOperation({ description: '댓글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':inquiryId/comments')
  async findAllInTraditionalStyle(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<InquiryComment>> {
    const result = await this.inquiryCommentsService.findAllInTraditionalStyle(
      query,
      inquiryId,
    );

    return result;
    // recursive tree 인 경우.
    // return {
    //   ...result,
    //   data: result.data.map((comment) =>
    //     this.inquiryCommentsService.buildInquiryCommentTree(comment),
    //   ),
    // };
  }

  @ApiOperation({ description: '댓글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':inquiryId/comments_counts')
  async findAllInYoutubeStyle(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<InquiryComment>> {
    const result = await this.inquiryCommentsService.findAllInYoutubeStyle(
      query,
      inquiryId,
    );

    return result;
  }

  //? 답글 리스트, 최상단 부모는 리턴되지 않음.
  @ApiOperation({ description: '답글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':inquiryId/comments/:commentId')
  async findAllRepliesById(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<InquiryComment>> {
    return await this.inquiryCommentsService.findAllRepliesById(
      query,
      inquiryId,
      commentId,
    );
  }

  //? ----------------------------------------------------------------------- //
  //? UPDATE
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '댓글 수정' })
  @Patch(':inquiryId/comments/:commentId')
  async update(
    @Param('inquiryId') inquiryId: number,
    @Param('commentId') commentId: number,
    @Body() dto: UpdateInquiryCommentDto,
  ): Promise<InquiryComment> {
    return await this.inquiryCommentsService.update(dto, commentId);
  }

  //? ----------------------------------------------------------------------- //
  //? DELETE
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '관리자) 댓글 soft 삭제' })
  @Delete(':inquiryId/comments/:commentId')
  async remove(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Param('commentId') commentId: number,
  ): Promise<InquiryComment> {
    return await this.inquiryCommentsService.softRemove(commentId);
  }
}
