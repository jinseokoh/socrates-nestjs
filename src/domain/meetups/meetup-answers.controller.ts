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
import { Answer } from 'src/domain/meetups/entities/answer.entity';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { IMessageEvent } from 'src/common/interfaces';
import { Observable } from 'rxjs';
import { SseService } from 'src/services/sse/sse.service';
import { EventPattern } from '@nestjs/microservices';
import { AnswersService } from 'src/domain/meetups/answers.service';
import { CreateAnswerDto } from 'src/domain/meetups/dto/create-answer.dto';
import { UpdateAnswerDto } from 'src/domain/meetups/dto/update-answer.dto';
@UseInterceptors(ClassSerializerInterceptor)
@Controller('meetups')
export class MeetupAnswersController {
  constructor(
    private readonly answersService: AnswersService,
    private readonly sseService: SseService,
  ) {}

  //?-------------------------------------------------------------------------//
  //? SSE
  //?-------------------------------------------------------------------------//

  @EventPattern('sse.answers')
  handleSseAnswers(data: any): void {
    this.sseService.fire(data.key, data.value);
  }

  @Public()
  @Sse(':meetupId/quesitons/:questionId/answers/stream')
  sse(): Observable<IMessageEvent> {
    return this.sseService.sseStream$;
  }

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '댓글 등록' })
  @UsePipes(new ValidationPipe({ skipMissingProperties: true }))
  @Post(':meetupId/quesitons/:questionId/answers/:answerId?')
  async create(
    @CurrentUserId() userId: number,
    @Param('answerId') answerId: number | null,
    @Param('questionId') questionId: number,
    @Body() dto: CreateAnswerDto,
  ): Promise<any> {
    let parentId = null;
    if (answerId) {
      const answer = await this.answersService.findById(answerId);
      parentId = answer.parentId ? answer.parentId : answerId;
    }
    return await this.answersService.create({
      ...dto,
      userId,
      questionId,
      parentId,
    });
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//
  @ApiOperation({ description: '댓글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':meetupId/quesitons/:questionId/answers')
  async getAnswers(
    @Param('questionId') questionId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Answer>> {
    return await this.answersService.findAll(questionId, query);
  }

  @ApiOperation({ description: '대댓글 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':meetupId/quesitons/:questionId/answers/:answerId')
  async getAnswersById(
    @Param('questionId') questionId: number,
    @Param('answerId') answerId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Answer>> {
    return await this.answersService.findAllById(questionId, answerId, query);
  }

  // [admin] specific logic for Report
  @ApiOperation({ description: '[관리자] 댓글 상세보기' })
  @Get(':meetupId/quesitons/answers/:answerId')
  async getAnswerById(@Param('answerId') answerId: number): Promise<Answer> {
    return await this.answersService.findById(answerId, ['question']);
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '댓글 수정' })
  @Patch(':meetupId/quesitons/:questionId/answers/:answerId')
  async update(
    @Param('answerId') id: number,
    @Body() dto: UpdateAnswerDto,
  ): Promise<Answer> {
    return await this.answersService.update(id, dto);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '관리자) 댓글 soft 삭제' })
  @Delete(':meetupId/quesitons/:questionId/answers/:answerId')
  async remove(@Param('answerId') id: number): Promise<Answer> {
    const answer = await this.answersService.findByUniqueKey({
      where: { parentId: id },
    });
    if (answer) {
      // 대댓글이 있으면 모두 삭제
      await this.answersService.softRemove(answer.id);
    }

    return await this.answersService.softRemove(id);
  }
}
