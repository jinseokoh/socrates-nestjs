import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { SignedUrl } from 'src/common/types';
import { AnswersService } from 'src/domain/icebreakers/answers.service';
import { CreateAnswerDto } from 'src/domain/icebreakers/dto/create-answer.dto';
import { UpdateAnswerDto } from 'src/domain/icebreakers/dto/update-answer.dto';
import { Answer } from 'src/domain/icebreakers/entities/answer.entity';
import { Reaction } from 'src/domain/icebreakers/entities/reaction.entity';
import { SignedUrlDto } from 'src/domain/users/dto/signed-url.dto';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('answers')
export class AnswersController {
  constructor(private readonly answersService: AnswersService) {}

  //? ----------------------------------------------------------------------- //
  //? Create
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '커넥션 답변 생성/수정' })
  @Post()
  async createAnswer(
    @CurrentUserId() userId: number,
    @Body() dto: CreateAnswerDto,
  ): Promise<Answer> {
    try {
      return await this.answersService.create({ ...dto, userId });
    } catch (e) {
      throw new BadRequestException();
    }
  }

  //? ----------------------------------------------------------------------- //
  //? READ
  //? ----------------------------------------------------------------------- //

  @Public()
  @ApiOperation({ description: 'Answer 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get()
  async findAll(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Answer>> {
    return await this.answersService.findAll(query);
  }

  //? the commenting out relations can be ignored to reduce the amount of response
  @ApiOperation({ description: 'Answer 상세보기' })
  @Get(':id')
  async getAnswerById(@Param('id') id: number): Promise<Answer> {
    return await this.answersService.findById(id, [
      'question',
      'answer_comments',
      'answer_comments.user',
      'answer_comments.user.profile',
      'userReports',
      'userReactions',
      'user',
      'user.profile',
      'user.answers',
      'user.answers.question',
      'user.answers.answer_comments',
      'user.answers.answer_comments.user',
      // 'user.sentFriendships',
    ]);
  }

  @ApiOperation({ description: 'Answer 의 reaction 리스트' })
  @Get(':id/reactions')
  async getAnswerReactionsById(
    @Param('id') id: number,
  ): Promise<Reaction[]> {
    const answer = await this.answersService.findById(id, [
      'userReactions',
      'userReactions.user',
      'userReactions.user.profile',
    ]);

    return answer.userReactions ?? [];
  }

  //? ----------------------------------------------------------------------- //
  //? UPDATE
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '발견글 수정' })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAnswerDto,
  ): Promise<Answer> {
    return await this.answersService.update(id, dto);
  }

  //? ----------------------------------------------------------------------- //
  //? UPLOAD
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 's3 직접 업로드를 위한 signedUrl 리턴' })
  @Post('upload-url')
  async getSignedUrl(
    @CurrentUserId() userId: number,
    @Body() dto: SignedUrlDto,
  ): Promise<SignedUrl> {
    return await this.answersService.getSignedUrl(userId, dto);
  }

  //? ----------------------------------------------------------------------- //
  //? SEED
  //? ----------------------------------------------------------------------- //

  // just for testing
  @ApiOperation({ description: 'seed questions' })
  @Post('seed')
  async seedAnswers(): Promise<void> {
    return await this.answersService.seedAnswers();
  }
}
