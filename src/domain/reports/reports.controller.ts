import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { CreateReportDto } from 'src/domain/reports/dto/create-report.dto';
import { UpdateReportDto } from 'src/domain/reports/dto/update-report.dto';
import { Report } from 'src/domain/reports/entities/report.entity';
import { ReportsService } from 'src/domain/reports/reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '신고 생성' })
  @Post()
  async create(@Body() dto: CreateReportDto): Promise<Report> {
    return await this.reportsService.create(dto);
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '신고 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get()
  async getExtendedReport(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Report>> {
    return await this.reportsService.findAll(query);
  }

  @ApiOperation({ description: '신고 상세보기' })
  @Get(':id')
  async getReportById(@Param('id') id: number): Promise<Report> {
    return await this.reportsService.findById(id, ['user', 'user.profile']);
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '신고 수정' })
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() dto: UpdateReportDto,
  ): Promise<Report> {
    return await this.reportsService.update(id, dto);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '신고 삭제' })
  @Delete(':id')
  async remove(@Param('id') id: number): Promise<Report> {
    return await this.reportsService.remove(id);
  }
}
