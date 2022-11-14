import {
  Body,
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
import { ApiOperation } from '@nestjs/swagger';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { CreateNewsDto } from 'src/domain/news/dto/create-news.dto';
import { UpdateNewsDto } from 'src/domain/news/dto/update-news.dto';
import { News } from 'src/domain/news/news.entity';
import { NewsService } from 'src/domain/news/news.service';
import { UniqueTitlePipe } from 'src/domain/news/pipes/unique-title.pipe';
import { multerOptions } from 'src/helpers/multer-options';
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '공지사항 생성' })
  @Post()
  async create(@Body(UniqueTitlePipe) dto: CreateNewsDto): Promise<News> {
    return await this.newsService.create(dto);
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '공지사항 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get('admin')
  async getExtendedNews(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<News>> {
    return await this.newsService.findAllExtended(query);
  }

  @ApiOperation({ description: '공지사항 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get()
  async getNews(@Paginate() query: PaginateQuery): Promise<Paginated<News>> {
    return await this.newsService.findAll(query);
  }

  @ApiOperation({ description: '공지사항 상세보기' })
  @Get(':id')
  async getNewsById(@Param('id') id: number): Promise<News> {
    return await this.newsService.findById(id);
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '공지사항 수정' })
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() dto: UpdateNewsDto,
  ): Promise<News> {
    return await this.newsService.update(id, dto);
  }

  @ApiOperation({ description: '공지사항 image 갱신' })
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @Post(':id/image')
  async upload(
    @Param('id') id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.newsService.upload(id, file);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '공지사항 삭제' })
  @Delete(':id')
  async remove(@Param('id') id: number): Promise<News> {
    return await this.newsService.remove(id);
  }
}
