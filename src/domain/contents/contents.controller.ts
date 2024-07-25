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
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { ContentsService } from 'src/domain/contents/contents.service';
import { CreateContentDto } from 'src/domain/contents/dto/create-content.dto';
import { UpdateContentDto } from 'src/domain/contents/dto/update-content.dto';
import { Content } from 'src/domain/contents/entities/content.entity';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('contents')
export class ContentsController {
  constructor(private readonly contentsService: ContentsService) {}

  //? ----------------------------------------------------------------------- //
  //? CREATE
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '공지사항 생성' })
  @Post()
  async create(@Body() dto: CreateContentDto): Promise<Content> {
    return await this.contentsService.create(dto);
  }

  //? ----------------------------------------------------------------------- //
  //? READ
  //? ----------------------------------------------------------------------- //

  @Public()
  @ApiOperation({ description: '공지사항 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get()
  async findAll(@Paginate() query: PaginateQuery): Promise<Paginated<Content>> {
    return await this.contentsService.findAll(query);
  }

  @ApiOperation({ description: '공지사항 상세보기' })
  @Get(':slug')
  async getActiveContents(@Param('slug') slug: string): Promise<Content[]> {
    return await this.contentsService.loadContentsBySlug(slug);
  }

  @ApiOperation({ description: '공지사항 상세보기' })
  @Get(':id')
  async findById(@Param('id') id: number): Promise<Content> {
    return await this.contentsService.findById(id);
  }

  //? ----------------------------------------------------------------------- //
  //? UPDATE
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '공지사항 수정' })
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() dto: UpdateContentDto,
  ): Promise<Content> {
    return await this.contentsService.update(id, dto);
  }

  //? ----------------------------------------------------------------------- //
  //? DELETE
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '공지사항 삭제' })
  @Delete(':id')
  async remove(@Param('id') id: number): Promise<Content> {
    return await this.contentsService.remove(id);
  }
}
