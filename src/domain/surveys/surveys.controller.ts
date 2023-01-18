import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { CreateSurveyDto } from 'src/domain/surveys/dto/create-survey.dto';
import { UpdateSurveyDto } from 'src/domain/surveys/dto/update-survey.dto';
import { Survey } from 'src/domain/surveys/entities/survey.entity';
import { SurveysService } from 'src/domain/surveys/surveys.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('surveys')
export class SurveysController {
  constructor(private readonly surveysService: SurveysService) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Survey 생성' })
  @Post()
  async create(
    @CurrentUserId() userId: number,
    @Body() dto: CreateSurveyDto,
  ): Promise<Survey> {
    console.log({ ...dto, userId });
    return await this.surveysService.create({ ...dto, userId });
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Survey 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get()
  async getSurveys(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Survey>> {
    return this.surveysService.findAll(query);
  }

  @ApiOperation({ description: 'Survey 상세보기' })
  @Get(':id')
  async getSurveyById(@Param('id') id: number): Promise<Survey> {
    return await this.surveysService.findById(id, ['user']);
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Survey 갱신' })
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() dto: UpdateSurveyDto,
  ): Promise<Survey> {
    return await this.surveysService.update(id, dto);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Survey soft 삭제' })
  @Delete(':id')
  async softRemove(@Param('id') id: number): Promise<Survey> {
    return await this.surveysService.softRemove(id);
  }
}
