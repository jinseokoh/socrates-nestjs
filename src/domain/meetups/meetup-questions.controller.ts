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
import { CreateQuestionDto } from 'src/domain/questions/dto/create-question.dto';
import { UpdateQuestionDto } from 'src/domain/questions/dto/update-question.dto';
import { Question } from 'src/domain/questions/entities/question.entity';
import { QuestionsService } from 'src/domain/questions/questions.service';
@UseInterceptors(ClassSerializerInterceptor)
@Controller('meetups')
export class MeetupQuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '질문 생성' })
  @Post(':meetupId/questions')
  async create(
    @CurrentUserId() userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Body() dto: CreateQuestionDto,
  ): Promise<Question> {
    return await this.questionsService.create({ ...dto, userId, meetupId });
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '질문 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':meetupId/questions')
  async getQuestions(
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Question>> {
    const queryParams = {
      ...query,
      ...{
        filter: {
          meetupId: `$eq:${meetupId}`,
        },
      },
    };

    return await this.questionsService.findAll(queryParams);
  }

  @ApiOperation({ description: '질문 상세보기' })
  @Get(':meetupId/questions/:questionId')
  async getQuestionById(
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Param('questionId', ParseIntPipe) questionId: number,
  ): Promise<Question> {
    return await this.questionsService.findById(questionId, [
      'user',
      'comments',
    ]);
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '질문 수정' })
  @Patch(':meetupId/questions/:questionId')
  async update(
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Param('questionId', ParseIntPipe) questionId: number,
    @Body() dto: UpdateQuestionDto,
  ): Promise<Question> {
    return await this.questionsService.update(questionId, dto);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '질문 soft 삭제' })
  @Delete(':meetupId/questions/:questionId')
  async remove(
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Param('questionId', ParseIntPipe) questionId: number,
  ): Promise<Question> {
    return await this.questionsService.softRemove(questionId);
  }
}
