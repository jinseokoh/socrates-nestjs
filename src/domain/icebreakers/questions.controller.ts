import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
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
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { QuestionsService } from 'src/domain/icebreakers/questions.service';
import { CreateQuestionDto } from 'src/domain/icebreakers/dto/create-question.dto';
import { UpdateQuestionDto } from 'src/domain/icebreakers/dto/update-question.dto';
import { Question } from 'src/domain/icebreakers/entities/question.entity';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  //? ----------------------------------------------------------------------- //
  //? Create
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '커넥션 질문 추가' })
  @Post()
  async createAnswer(
    @CurrentUserId() userId: number,
    @Body() dto: CreateQuestionDto,
  ): Promise<Question> {
    try {
      return await this.questionsService.create({ ...dto, userId });
    } catch (e) {
      throw new BadRequestException();
    }
  }

  //? ----------------------------------------------------------------------- //
  //? READ
  //? ----------------------------------------------------------------------- //

  @Public()
  @ApiOperation({ description: 'Question 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get()
  async findAll(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Question>> {
    return await this.questionsService.findAll(query);
  }

  @Public()
  @ApiOperation({ description: 'load active questions' })
  @Get('active')
  async getActives(
    @Query('age') age: number | undefined,
  ): Promise<Array<Question>> {
    return await this.questionsService.getActives(age);
  }

  @Public()
  @ApiOperation({ description: 'load inactive questions' })
  @Get('inactive')
  async getInactives(
    @Query('age') age: number | undefined,
  ): Promise<Array<Question>> {
    return await this.questionsService.getInactives(age);
  }

  @Public()
  @ApiOperation({ description: 'load active questions by slug' })
  @Get('active/:slug')
  async getActivesBySlug(
    @Param('slug') slug: string,
    @Query('age') age: number | undefined,
  ): Promise<Array<Question>> {
    return await this.questionsService.getActivesBySlug(slug, age);
  }

  //? ----------------------------------------------------------------------- //
  //? UPDATE
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'Question 갱신' })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateQuestionDto,
  ): Promise<any> {
    return await this.questionsService.update(id, dto);
  }

  @ApiOperation({ description: 'Question 갱신' })
  @Patch(':id/up')
  async thumbsUp(@Param('id', ParseIntPipe) id: number): Promise<any> {
    return await this.questionsService.thumbsUp(id);
  }

  @ApiOperation({ description: 'Question 갱신' })
  @Patch(':id/down')
  async thumbsDown(@Param('id', ParseIntPipe) id: number): Promise<any> {
    return await this.questionsService.thumbsDown(id);
  }

  //? ----------------------------------------------------------------------- //
  //? SEED
  //? ----------------------------------------------------------------------- //

  @Public()
  @ApiOperation({ description: 'seed questions' })
  @Post('seed')
  async seedQuestions(): Promise<void> {
    return await this.questionsService.seedQuestions();
  }
}
