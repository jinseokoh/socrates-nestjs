import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { HttpCacheInterceptor } from 'src/common/interceptors/http-cache.interceptor';
import { CategoriesService } from 'src/domain/categories/categories.service';

@UseInterceptors(ClassSerializerInterceptor, HttpCacheInterceptor)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'return all trees' })
  @Get('')
  async getAllCategories(): Promise<any> {
    return await this.categoriesService.findAll();
  }

  @ApiOperation({ description: 'return sub-trees' })
  @Get(':slug')
  async getBySlug(@Param('slug') slug: string): Promise<any> {
    return await this.categoriesService.findBySlug(slug);
  }

  //?-------------------------------------------------------------------------//
  //? SEED
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'seed categories' })
  @Post('seed')
  async seed(): Promise<void> {
    return await this.categoriesService.seedCategory();
  }
}
