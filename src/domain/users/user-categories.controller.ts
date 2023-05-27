import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { AnyData } from 'src/common/types';
import { Category } from 'src/domain/categories/entities/category.entity';
import { SyncCategoryDto } from 'src/domain/users/dto/sync-category.dto';
import { UsersService } from 'src/domain/users/users.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UserCategoriesController {
  constructor(private readonly usersService: UsersService) {}

  //?-------------------------------------------------------------------------//
  //? Create
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '나의 관심사 리스트에 추가' })
  @Post(':userId/categories')
  async create(
    @Param('userId') userId: number,
    @Body() dto: SyncCategoryDto,
  ): Promise<AnyData> {
    if (dto.ids) {
      try {
        const user = await this.usersService.syncCategoriesWithIds(
          userId,
          dto.ids,
        );
        return {
          data: user.categories,
        };
      } catch (e) {
        throw new BadRequestException();
      }
    }
    if (dto.slugs) {
      try {
        const user = await this.usersService.syncCategoriesWithSlugs(
          userId,
          dto.slugs,
        );
        return {
          data: user.categories,
        };
      } catch (e) {
        throw new BadRequestException();
      }
    }
    throw new BadRequestException(`required fields is missing`);
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '나의 관심사 리스트' })
  @Get(':userId/categories')
  async getCategories(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Array<Category>> {
    return await this.usersService.getCategories(userId);
  }

  //?-------------------------------------------------------------------------//
  //? Delete
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '나의 관심사 리스트에서 삭제' })
  @PaginateQueryOptions()
  @Delete(':userId/categories')
  async delete(
    @Param('userId') userId: number,
    @Body('ids') ids: number[],
  ): Promise<AnyData> {
    try {
      const user = await this.usersService.removeCategories(userId, ids);
      return {
        data: user.categories,
      };
    } catch (e) {
      throw new BadRequestException();
    }
  }
}
