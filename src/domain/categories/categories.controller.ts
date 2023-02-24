import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { CategoriesService } from 'src/domain/categories/categories.service';

@UseInterceptors(ClassSerializerInterceptor)
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

  //?-------------------------------------------------------------------------//
  //? SEED
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'seed categories' })
  @Post('seed')
  async category(): Promise<void> {
    return await this.categoriesService.seedCategory();
  }
}
