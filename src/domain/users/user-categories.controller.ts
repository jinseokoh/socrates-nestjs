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
  Put,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { SyncCategoryDto } from 'src/domain/users/dto/sync-category.dto';
import { Interest } from 'src/domain/users/entities/interest.entity';
import { UsersService } from 'src/domain/users/users.service';

@UseInterceptors(ClassSerializerInterceptor)
@SkipThrottle()
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
  ): Promise<Array<Interest>> {
    if (dto.ids) {
      try {
        return await this.usersService.syncCategoriesWithIds(userId, dto.ids);
      } catch (e) {
        throw new BadRequestException();
      }
    }
    if (dto.slugs) {
      try {
        return await this.usersService.syncCategoriesWithSlugs(
          userId,
          dto.slugs,
        );
      } catch (e) {
        throw new BadRequestException();
      }
    }
    throw new BadRequestException(`required fields is missing`);
  }

  @ApiOperation({ description: '나의 관심사 리스트에 추가' })
  @Put(':userId/categories/:slug')
  async addCategoryWithSkill(
    @Param('userId') userId: number,
    @Param('slug') slug: string,
    @Body('skill') skill: number | null,
  ): Promise<Array<Interest>> {
    try {
      return await this.usersService.upsertCategoryWithSkill(
        userId,
        slug,
        skill,
      );
    } catch (e) {
      throw new BadRequestException();
    }
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '나의 관심사 리스트' })
  @Get(':userId/categories')
  async getCategories(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Array<Interest>> {
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
  ): Promise<Array<Interest>> {
    try {
      return await this.usersService.removeCategories(userId, ids);
    } catch (e) {
      throw new BadRequestException();
    }
  }
}
