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
import { CreateIcebreakerCommentDto } from 'src/domain/icebreakers/dto/create-icebreaker_comment.dto';
import { UpdateIcebreakerCommentDto } from 'src/domain/icebreakers/dto/update-icebreaker_comment.dto';
import { IcebreakerComment } from 'src/domain/icebreakers/entities/icebreaker_comment.entity';
import { IcebreakerCommentUsersService } from 'src/domain/icebreakers/icebreaker_comment-users.service';
import { SignedUrlDto } from 'src/domain/users/dto/signed-url.dto';
import { Flag } from 'src/domain/users/entities/flag.entity';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('icebreakers')
export class IcebreakerCommentUsersController {
  constructor(
    private readonly icebreakerCommentUsersService: IcebreakerCommentUsersService,
  ) {}

  //? ----------------------------------------------------------------------- //
  //? 모임 댓글 생성
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '댓글 생성' })
  @Post(':icebreakerId/comments')
  async createIcebreakerComment(
    @CurrentUserId() userId: number,
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
    @Body() dto: CreateIcebreakerCommentDto,
  ): Promise<IcebreakerComment> {
    let parentId = null;
    if (dto.commentId) {
      const comment = await this.icebreakerCommentUsersService.findById(
        dto.commentId,
      );
      parentId = comment.parentId ? comment.parentId : dto.commentId;
    }

    return await this.icebreakerCommentUsersService.create({
      ...dto,
      userId,
      icebreakerId,
      parentId,
      sendNotification: dto.sendNotification ?? false,
    });
  }

  //? ----------------------------------------------------------------------- //
  //? 모임 댓글 리스트
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '댓글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':icebreakerId/comments')
  async findAllInTraditionalStyle(
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<IcebreakerComment>> {
    const result =
      await this.icebreakerCommentUsersService.findAllInTraditionalStyle(
        query,
        icebreakerId,
      );

    return result;
    // recursive tree 인 경우.
    // return {
    //   ...result,
    //   data: result.data.map((comment) =>
    //     this.icebreakerCommentUsersService.buildIcebreakerCommentTree(comment),
    //   ),
    // };
  }

  @ApiOperation({ description: '댓글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':icebreakerId/comments_counts')
  async findAllInYoutubeStyle(
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<IcebreakerComment>> {
    const result = await this.icebreakerCommentUsersService.findAllInYoutubeStyle(
      query,
      icebreakerId,
    );

    return result;
  }

  //? 답글 리스트, 최상단 부모는 리턴되지 않음.
  @ApiOperation({ description: '답글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':icebreakerId/comments/:commentId')
  async findIcebreakerCommentRepliesById(
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<IcebreakerComment>> {
    return await this.icebreakerCommentUsersService.findAllRepliesById(
      query,
      icebreakerId,
      commentId,
    );
  }

  //? ----------------------------------------------------------------------- //
  //? 모임 댓글 update
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '댓글 수정' })
  @Patch(':icebreakerId/comments/:commentId')
  async updateIcebreakerComment(
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() dto: UpdateIcebreakerCommentDto,
  ): Promise<IcebreakerComment> {
    return await this.icebreakerCommentUsersService.update(commentId, dto);
  }

  //? ----------------------------------------------------------------------- //
  //? 모임 댓글 delete
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '댓글 soft 삭제' })
  @Delete(':icebreakerId/comments/:commentId')
  async deleteIcebreakerComment(
    // @CurrentUserId() userId: number,
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
  ): Promise<IcebreakerComment> {
    return await this.icebreakerCommentUsersService.softRemove(commentId);
  }

  //? ----------------------------------------------------------------------- //
  //? 모임 댓글 Flag
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'add flag 댓글/답글' })
  @Post(':icebreakerId/comments/:commentId/flag')
  async createIcebreakerCommentFlag(
    @CurrentUserId() userId: number,
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body('message') message: string,
  ): Promise<Flag> {
    return await this.icebreakerCommentUsersService.createIcebreakerCommentFlag(
      userId,
      icebreakerId,
      commentId,
      message,
    );
  }

  @ApiOperation({ description: 'delete flag 댓글/답글' })
  @Delete(':icebreakerId/comments/:commentId/flag')
  async deleteIcebreakerCommentFlag(
    @CurrentUserId() userId: number,
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
  ): Promise<Flag> {
    return await this.icebreakerCommentUsersService.deleteIcebreakerCommentFlag(
      userId,
      commentId,
    );
  }

  //? ----------------------------------------------------------------------- //
  //? S3 Upload
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 's3 직접 업로드를 위한 signedUrl 리턴' })
  @Post(':icebreakerId/comments/upload-url')
  async getSignedUrl(
    @CurrentUserId() userId: number,
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
    @Body() dto: SignedUrlDto,
  ): Promise<SignedUrl> {
    return await this.icebreakerCommentUsersService.getSignedUrl(
      userId,
      icebreakerId,
      dto,
    );
  }
}
