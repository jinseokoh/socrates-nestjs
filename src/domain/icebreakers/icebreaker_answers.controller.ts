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
import { Icebreaker } from 'src/domain/icebreakers/entities/icebreaker.entity';
import { IcebreakerAnswer } from 'src/domain/icebreakers/entities/icebreaker_answer.entity';
import { IcebreakerAnswersService } from 'src/domain/icebreakers/icebreaker_answers.service';
import { SignedUrlDto } from 'src/domain/users/dto/signed-url.dto';

@UseInterceptors(ClassSerializerInterceptor)
@Controller()
export class IcebreakerAnswersController {
  constructor(
    private readonly icebreakerAnswersService: IcebreakerAnswersService,
  ) {}

  //? ----------------------------------------------------------------------- //
  //? CREATE
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '답변 생성' })
  @Post('icebreakers/:icebreakerId/answers')
  async createIcebreakerAnswer(
    @CurrentUserId() userId: number,
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
    @Body() dto: CreateIcebreakerAnswerDto,
  ): Promise<IcebreakerAnswer> {
    let parentId = null;

    if (dto.answerId) {
      const answer = await this.icebreakerAnswersService.findById(dto.answerId);
      parentId = answer.parentId ? answer.parentId : dto.answerId;
    }

    return await this.icebreakerAnswersService.create({
      ...dto,
      userId: dto.userId ?? userId,
      icebreakerId,
      parentId,
      sendNotification: dto.sendNotification ?? false,
    });
  }

  //? ----------------------------------------------------------------------- //
  //? READ
  //? ----------------------------------------------------------------------- //

  //? 아이스브레이커 답글 리스트
  @ApiOperation({ description: '아이스브레이커 답글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get('icebreakers/:icebreakerId/answers')
  async findAll(
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<IcebreakerAnswer>> {
    const result = await this.icebreakerAnswersService.findAllById(
      query,
      icebreakerId,
    );

    return result;
  }

  @ApiOperation({ description: '댓글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get('icebreaker-answers')
  async findAllInTraditionalStyle(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<IcebreakerAnswer>> {
    return await this.icebreakerAnswersService.findAll(query);
    // recursive tree 인 경우.
    // return {
    //   ...result,
    //   data: result.data.map((answer) =>
    //     this.icebreakerAnswersService.buildIcebreakerAnswerTree(answer),
    //   ),
    // };
  }

  // //? 답글 리스트 with count
  // @ApiOperation({ description: '댓글 with count 리스트 w/ Pagination' })
  // @PaginateQueryOptions()
  // @Get('icebreaker-answers/wc')
  // async findAllInYoutubeStyle(
  //   @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
  //   @Paginate() query: PaginateQuery,
  // ): Promise<Paginated<IcebreakerAnswer>> {
  //   const result = await this.icebreakerAnswersService.findAllInYoutubeStyle(
  //     query,
  //     icebreakerId,
  //   );

  //   return result;
  // }

  // //? 답글 리스트, 최상단 부모는 리턴되지 않음.
  // @ApiOperation({ description: '답글 리스트 w/ Pagination' })
  // @PaginateQueryOptions()
  // @Get('icebreaker-answers/:answerId')
  // async findIcebreakerAnswerRepliesById(
  //   @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
  //   @Param('answerId', ParseIntPipe) answerId: number,
  //   @Paginate() query: PaginateQuery,
  // ): Promise<Paginated<IcebreakerAnswer>> {
  //   return await this.icebreakerAnswersService.findAllRepliesById(
  //     query,
  //     icebreakerId,
  //     answerId,
  //   );
  // }

  //! 상세보기
  @ApiOperation({ description: 'IcebreakerAnswer 상세보기' })
  @Get('icebreaker-answers/:answerid')
  async findById(
    @Param('answerid') answerid: number,
  ): Promise<IcebreakerAnswer> {
    return await this.icebreakerAnswersService.findById(answerid, [
      // 'question', not sure if it's
      'user',
      'icebreaker',
    ]);
  }

  //? ----------------------------------------------------------------------- //
  //? UPDATE
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '댓글 수정' })
  @Patch('icebreaker-answers/:answerId')
  async updateIcebreakerAnswer(
    @Param('answerId', ParseIntPipe) answerId: number,
    @Body() dto: UpdateIcebreakerAnswerDto,
  ): Promise<IcebreakerAnswer> {
    return await this.icebreakerAnswersService.update(answerId, dto);
  }

  //? ----------------------------------------------------------------------- //
  //? DELETE
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '댓글 soft 삭제' })
  @Delete('icebreaker-answers/:answerId')
  async deleteIcebreakerAnswer(
    // @CurrentUserId() userId: number,
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
    @Param('answerId', ParseIntPipe) answerId: number,
  ): Promise<IcebreakerAnswer> {
    return await this.icebreakerAnswersService.softRemove(answerId);
  }

  //? ----------------------------------------------------------------------- //
  //? S3 Upload
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 's3 직접 업로드를 위한 signedUrl 리턴' })
  @Post('icebreaker-answers/upload-url')
  async getSignedUrl(
    @CurrentUserId() userId: number,
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
    @Body() dto: SignedUrlDto,
  ): Promise<SignedUrl> {
    return await this.icebreakerAnswersService.getSignedUrl(
      userId,
      icebreakerId,
      dto,
    );
  }
}
