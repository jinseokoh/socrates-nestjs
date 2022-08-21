import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiOperation } from '@nestjs/swagger';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { CreateQuestionDto } from 'src/domain/questions/dto/create-question.dto';
import { UpdateQuestionDto } from 'src/domain/questions/dto/update-question.dto';
import { Question } from 'src/domain/questions/question.entity';
import { QuestionsService } from 'src/domain/questions/questions.service';
import { multerOptions } from 'src/helpers/multer-options';
@UseInterceptors(ClassSerializerInterceptor)
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @ApiOperation({ description: '질문 생성' })
  @Post()
  async create(
    @CurrentUserId() userId: number,
    @Body() dto: CreateQuestionDto,
  ): Promise<Question> {
    return await this.questionsService.create({ ...dto, userId });
  }

  @ApiOperation({ description: '질문 이미지 생성 (최대 5장)' })
  @UseInterceptors(FilesInterceptor('files', 5, multerOptions))
  @Post(':id/images')
  async upload(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Param('id') id: number,
  ): Promise<Question> {
    return await this.questionsService.upload(id, files);
  }

  @ApiOperation({ description: '질문 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get()
  async getQuestions(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Question>> {
    return await this.questionsService.findAll(query);
  }

  @ApiOperation({ description: '질문 상세보기' })
  @Get(':id')
  async getQuestionById(@Param('id') id: number): Promise<Question> {
    return await this.questionsService.findById(id, ['user']);
  }

  @ApiOperation({ description: '질문 수정' })
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() dto: UpdateQuestionDto,
  ): Promise<Question> {
    return await this.questionsService.update(id, dto);
  }

  @ApiOperation({ description: '질문 soft 삭제' })
  @Delete(':id')
  async remove(@Param('id') id: number): Promise<Question> {
    return await this.questionsService.softRemove(id);
  }
}
