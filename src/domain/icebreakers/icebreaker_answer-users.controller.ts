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
import { CreateIcebreakerAnswerDto } from 'src/domain/icebreakers/dto/create-icebreaker_answer.dto';
import { UpdateIcebreakerAnswerDto } from 'src/domain/icebreakers/dto/update-icebreaker_answer.dto';
import { IcebreakerAnswer } from 'src/domain/icebreakers/entities/icebreaker_answer.entity';
import { IcebreakerAnswerUsersService } from 'src/domain/icebreakers/icebreaker_answer-users.service';
import { SignedUrlDto } from 'src/domain/users/dto/signed-url.dto';
import { Flag } from 'src/domain/users/entities/flag.entity';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('icebreakers')
export class IcebreakerAnswerUsersController {
  constructor(
    private readonly icebreakerCommentUsersService: IcebreakerAnswerUsersService,
  ) {}

  //? ----------------------------------------------------------------------- //
  //? 모임 댓글 생성
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '댓글 생성' })
  @Post(':icebreakerId/comments')
  async createIcebreakerAnswer(
    @CurrentUserId() userId: number,
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
    @Body() dto: CreateIcebreakerAnswerDto,
  ): Promise<IcebreakerAnswer> {
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
  ): Promise<Paginated<IcebreakerAnswer>> {
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
    //     this.icebreakerCommentUsersService.buildIcebreakerAnswerTree(comment),
    //   ),
    // };
  }

  @ApiOperation({ description: '댓글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':icebreakerId/comments_counts')
  async findAllInYoutubeStyle(
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<IcebreakerAnswer>> {
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
  async findIcebreakerAnswerRepliesById(
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<IcebreakerAnswer>> {
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
  async updateIcebreakerAnswer(
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() dto: UpdateIcebreakerAnswerDto,
  ): Promise<IcebreakerAnswer> {
    return await this.icebreakerCommentUsersService.update(commentId, dto);
  }

  //? ----------------------------------------------------------------------- //
  //? 모임 댓글 delete
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '댓글 soft 삭제' })
  @Delete(':icebreakerId/comments/:commentId')
  async deleteIcebreakerAnswer(
    // @CurrentUserId() userId: number,
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
  ): Promise<IcebreakerAnswer> {
    return await this.icebreakerCommentUsersService.softRemove(commentId);
  }

  //? ----------------------------------------------------------------------- //
  //? 모임 댓글 Flag
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'add flag 댓글/답글' })
  @Post(':icebreakerId/comments/:commentId/flag')
  async createIcebreakerAnswerFlag(
    @CurrentUserId() userId: number,
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body('message') message: string,
  ): Promise<Flag> {
    return await this.icebreakerCommentUsersService.createIcebreakerAnswerFlag(
      userId,
      icebreakerId,
      commentId,
      message,
    );
  }

  @ApiOperation({ description: 'delete flag 댓글/답글' })
  @Delete(':icebreakerId/comments/:commentId/flag')
  async deleteIcebreakerAnswerFlag(
    @CurrentUserId() userId: number,
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
  ): Promise<Flag> {
    return await this.icebreakerCommentUsersService.deleteIcebreakerAnswerFlag(
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
