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
import { Article } from 'src/domain/articles/article.entity';
import { ArticlesService } from 'src/domain/articles/articles.service';
import { CreateArticleDto } from 'src/domain/articles/dto/create-article.dto';
import { UpdateArticleDto } from 'src/domain/articles/dto/update-article.dto';
import { UniqueTitlePipe } from 'src/domain/articles/pipes/unique-title.pipe';
@UseInterceptors(ClassSerializerInterceptor)
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @ApiOperation({ description: '관리자) 아티클 생성' })
  @Post()
  async create(
    @Body(UniqueTitlePipe)
    dto: CreateArticleDto,
  ): Promise<Article> {
    return await this.articlesService.create(dto);
  }

  @ApiOperation({ description: '아티클 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get()
  async getArticles(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Article>> {
    return await this.articlesService.findAll(query);
  }

  @ApiOperation({ description: '아티클 상세보기' })
  @Get(':id')
  async getArticleById(@Param('id') id: number): Promise<Article> {
    return await this.articlesService.findById(id, [
      'auctions',
      'relatedArticles',
      'articleComments',
    ]);
  }

  @ApiOperation({ description: '관리자) 아티클 수정' })
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body(UniqueTitlePipe) dto: UpdateArticleDto,
  ): Promise<Article> {
    return await this.articlesService.update(id, dto);
  }

  @ApiOperation({ description: '관리자) 아티클 soft 삭제' })
  @Delete(':id')
  async remove(@Param('id') id: number): Promise<Article> {
    return await this.articlesService.softRemove(id);
  }
}
