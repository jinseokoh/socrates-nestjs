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
import { SkipThrottle } from '@nestjs/throttler';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { CreatePleaDto } from 'src/domain/icebreakers/dto/create-plea.dto';
import { UpdatePleaDto } from 'src/domain/icebreakers/dto/update-plea.dto';
import { Plea } from 'src/domain/icebreakers/entities/plea.entity';
import { PleasService } from 'src/domain/icebreakers/pleas.service';

@UseInterceptors(ClassSerializerInterceptor)
@SkipThrottle()
@Controller('pleas')
export class PleasController {
  constructor(private readonly pleasService: PleasService) {}

  //? ----------------------------------------------------------------------- //
  //? CREATE
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'Plea 생성' })
  @Post()
  async create(@Body() dto: CreatePleaDto): Promise<Plea> {
    return await this.pleasService.create(dto);
  }

  //? ----------------------------------------------------------------------- //
  //? READ
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'Plea 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get()
  async findAll(@Paginate() query: PaginateQuery): Promise<Paginated<Plea>> {
    return await this.pleasService.findAll(query);
  }

  @ApiOperation({ description: 'Plea 상세보기' })
  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number): Promise<Plea> {
    return await this.pleasService.findById(id);
  }

  //? ----------------------------------------------------------------------- //
  //? UPDATE
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'Plea 수정' })
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() dto: UpdatePleaDto,
  ): Promise<Plea> {
    return await this.pleasService.update(id, dto);
  }

  //? ----------------------------------------------------------------------- //
  //? DELETE
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'Plea 삭제' })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<Plea> {
    return await this.pleasService.remove(id);
  }
}
