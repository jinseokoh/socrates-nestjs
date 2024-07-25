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
import { ContentComment } from 'src/domain/contents/entities/content_comment.entity';
import { ContentCommentsService } from 'src/domain/contents/content-comments.service';
import { CreateContentCommentDto } from 'src/domain/contents/dto/create-content_comment.dto';
import { UpdateContentCommentDto } from 'src/domain/contents/dto/update-content_comment.dto';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('contents')
export class ContentCommentsController {
  constructor(
    private readonly contentCommentsService: ContentCommentsService,
  ) {}

  //? ----------------------------------------------------------------------- //
  //? CREATE
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '댓글 생성' })
  @UsePipes(new ValidationPipe({ skipMissingProperties: true }))
  @Post(':contentId/comments')
  async createContentComment(
    @CurrentUserId() userId: number,
    @Param('contentId', ParseIntPipe) contentId: number,
    @Body() dto: CreateContentCommentDto,
  ): Promise<any> {
    return await this.contentCommentsService.create({
      ...dto,
      userId,
      contentId,
      sendNotification: dto.sendNotification ?? false,
    });
  }

  @ApiOperation({ description: '답글 생성' })
  @UsePipes(new ValidationPipe({ skipMissingProperties: true }))
  @Post(':contentId/comments/:commentId')
  async createContentCommentReply(
    @CurrentUserId() userId: number,
    @Param('contentId', ParseIntPipe) contentId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() dto: CreateContentCommentDto,
  ): Promise<any> {
    const comment = await this.contentCommentsService.findById(commentId);
    const parentId = comment.parentId ? comment.parentId : commentId;

    return await this.contentCommentsService.create({
      ...dto,
      userId,
      contentId,
      parentId,
      sendNotification: dto.sendNotification ?? false,
    });
  }

  //? ----------------------------------------------------------------------- //
  //? READ
  //? ----------------------------------------------------------------------- //
  @ApiOperation({ description: '댓글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':contentId/comments')
  async findAllInTraditionalStyle(
    @Param('contentId', ParseIntPipe) contentId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<ContentComment>> {
    const result = await this.contentCommentsService.findAllInTraditionalStyle(
      query,
      contentId,
    );

    return result;
    // recursive tree 인 경우.
    // return {
    //   ...result,
    //   data: result.data.map((comment) =>
    //     this.contentCommentsService.buildContentCommentTree(comment),
    //   ),
    // };
  }

  @ApiOperation({ description: '댓글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':contentId/comments_counts')
  async findAllInYoutubeStyle(
    @Param('contentId', ParseIntPipe) contentId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<ContentComment>> {
    const result = await this.contentCommentsService.findAllInYoutubeStyle(
      query,
      contentId,
    );

    return result;
  }

  @ApiOperation({ description: '답글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':contentId/comments/:commentId')
  async findAllRepliesById(
    @Param('contentId', ParseIntPipe) contentId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<ContentComment>> {
    return await this.contentCommentsService.findAllRepliesById(
      query,
      contentId,
      commentId,
    );
  }

  //? ----------------------------------------------------------------------- //
  //? UPDATE
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '댓글 수정' })
  @Patch(':contentId/comments/:commentId')
  async update(
    @Param('contentId', ParseIntPipe) contentId: number,
    @Param('commentId') commentId: number,
    @Body() dto: UpdateContentCommentDto,
  ): Promise<ContentComment> {
    return await this.contentCommentsService.update(dto, commentId);
  }

  //? ----------------------------------------------------------------------- //
  //? DELETE
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '댓글 soft 삭제' })
  @Delete(':contentId/comments/:commentId')
  async remove(
    @Param('contentId', ParseIntPipe) contentId: number,
    @Param('commentId') commentId: number,
  ): Promise<ContentComment> {
    return await this.contentCommentsService.softRemove(commentId);
  }
}
