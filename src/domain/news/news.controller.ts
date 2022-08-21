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
import { CreateNewsDto } from 'src/domain/news/dto/create-news.dto';
import { UpdateNewsDto } from 'src/domain/news/dto/update-news.dto';
import { News } from 'src/domain/news/news.entity';
import { NewsService } from 'src/domain/news/news.service';
import { UniqueTitlePipe } from 'src/domain/news/pipes/unique-title.pipe';
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @ApiOperation({ description: '뉴스 생성' })
  @Post()
  async create(@Body(UniqueTitlePipe) dto: CreateNewsDto): Promise<News> {
    return await this.newsService.create(dto);
  }

  @ApiOperation({ description: '뉴스 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get()
  async getNews(@Paginate() query: PaginateQuery): Promise<Paginated<News>> {
    return await this.newsService.findAll(query);
  }

  @ApiOperation({ description: '뉴스 상세보기' })
  @Get(':id')
  async getNewsById(@Param('id') id: number): Promise<News> {
    return await this.newsService.findById(id);
  }

  @ApiOperation({ description: '뉴스 수정' })
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body(UniqueTitlePipe) dto: UpdateNewsDto,
  ): Promise<News> {
    return await this.newsService.update(id, dto);
  }

  @ApiOperation({ description: '뉴스 soft 삭제' })
  @Delete(':id')
  async remove(@Param('id') id: number): Promise<News> {
    return await this.newsService.remove(id);
  }
}
