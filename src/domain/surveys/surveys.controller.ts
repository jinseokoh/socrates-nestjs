import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiCreatedResponse, ApiOperation } from '@nestjs/swagger';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { AnyData } from 'src/common/types/any-data.type';
import { CreateSurveyDto } from 'src/domain/surveys/dto/create-survey.dto';
import { UpdateSurveyDto } from 'src/domain/surveys/dto/update-survey.dto';
import { Survey } from 'src/domain/Surveys/Survey.entity';
import { SurveysService } from 'src/domain/Surveys/Surveys.service';
import { UsersService } from 'src/domain/users/users.service';
import { multerOptions } from 'src/helpers/multer-options';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('surveys')
export class SurveysController {
  constructor(
    private readonly usersService: UsersService,
    private readonly SurveysService: SurveysService,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Survey 생성 (관리자)' })
  @Post()
  async create(
    @CurrentUserId() userId: number,
    @Body() dto: CreateSurveyDto,
  ): Promise<Survey> {
    return await this.SurveysService.create(dto);
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Survey 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @ApiCreatedResponse({ type: Paginated<Survey> })
  @Get()
  async getSurveys(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Survey>> {
    return this.SurveysService.findAll(query);
  }

  @ApiOperation({ description: 'Survey 상세보기' })
  @ApiCreatedResponse({ type: Survey })
  @Get(':id')
  async getSurveyById(@Param('id') id: number): Promise<Survey> {
    return await this.SurveysService.findById(id, ['user']);
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
    return await this.SurveysService.update(id, dto);
  }

  @ApiOperation({ description: 'Survey 이미지 저장후 URL (string) 리턴' })
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @Post('user/image')
  async uploadImageWithoutSurveyId(
    @Param('id') id: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<AnyData> {
    return await this.SurveysService.uploadImage(0, file);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Survey soft 삭제' })
  @Delete(':id')
  async softRemove(@Param('id') id: number): Promise<Survey> {
    return await this.SurveysService.softRemove(id);
  }
}
