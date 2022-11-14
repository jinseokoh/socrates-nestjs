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
import { ApiOperation } from '@nestjs/swagger';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { AnyData } from 'src/common/types/any-data.type';
import { Article } from 'src/domain/articles/article.entity';
import { ArticlesService } from 'src/domain/articles/articles.service';
import { ArticleFilter } from 'src/domain/articles/decorators/article-filter.decorator';
import { CreateArticleDto } from 'src/domain/articles/dto/create-article.dto';
import { UpdateArticleDtoWithArticeAuctionsDtoArticleArticlesDto } from 'src/domain/articles/dto/update-article.dto';
import { UniqueTitlePipe } from 'src/domain/articles/pipes/unique-title.pipe';
import { multerOptions } from 'src/helpers/multer-options';
@UseInterceptors(ClassSerializerInterceptor)
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Article 생성' })
  @Post()
  async create(
    @Body(UniqueTitlePipe)
    dto: CreateArticleDto,
  ): Promise<Article> {
    return await this.articlesService.create(dto);
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '관리자) Article 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get('admin')
  async getExtendedArticles(
    @ArticleFilter() filterQuery: any,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Article>> {
    const queryParams = {
      ...query,
      ...filterQuery,
    };
    return await this.articlesService.findAllExtended(queryParams);
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Article 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get()
  async getArticles(
    @ArticleFilter() filterQuery: any,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Article>> {
    const queryParams = {
      ...query,
      ...filterQuery,
    };
    return await this.articlesService.findAll(queryParams);
  }

  @ApiOperation({ description: 'Article 상세보기' })
  @Get(':id')
  async getArticleById(@Param('id') id: number): Promise<Article> {
    return await this.articlesService.findById(id, [
      'auctions',
      'auctions.artwork',
      'auctions.artwork.artist',
      'relatedArticles',
      'articleComments',
      'articleComments.user',
    ]);
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Article 갱신' })
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() dto: UpdateArticleDtoWithArticeAuctionsDtoArticleArticlesDto,
  ): Promise<Article> {
    return await this.articlesService.update(id, dto);
  }

  @ApiOperation({ description: 'Article 이미지 저장후 URL (string) 리턴' })
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @Post(':id/image')
  async uploadImage(
    @Param('id') id: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<AnyData> {
    return await this.articlesService.uploadImage(id, file);
  }

  @ApiOperation({ description: 'Article 이미지 삭제' })
  @Delete(':id/images')
  async deleteImages(
    @Param('id') id: number,
    @Body('urls') urls: Array<string>,
  ): Promise<Article> {
    return await this.articlesService.deleteImages(id, urls);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Article 삭제 (soft)' })
  @Delete(':id')
  async softRemove(@Param('id') id: number): Promise<Article> {
    return await this.articlesService.softRemove(id);
  }
}
