import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { SyncCategoryDto } from 'src/domain/users/dto/sync-category.dto';
import { Interest } from 'src/domain/users/entities/interest.entity';
import { UserCategoriesService } from 'src/domain/users/user-categories.service';

@UseInterceptors(ClassSerializerInterceptor)
@SkipThrottle()
@Controller('users')
export class UserCategoriesController {
  constructor(private readonly userCategoriesService: UserCategoriesService) {}

  //? ----------------------------------------------------------------------- //
  //? Create
  //? ----------------------------------------------------------------------- //

  @ApiOperation({
    description:
      '나의 관심사 리스트에 추가. (ids 건 slugs 건 하나의 endpoint 로 처리)',
  })
  @Post(':userId/categories')
  async syncCategoriesWithEitherIdsOrSlugs(
    @Param('userId') userId: number,
    @Body() dto: SyncCategoryDto,
  ): Promise<Array<Interest>> {
    if (dto.ids) {
      try {
        return await this.userCategoriesService.syncCategoriesWithIds(
          userId,
          dto.ids,
        );
      } catch (e) {
        throw new BadRequestException();
      }
    }
    if (dto.slugs) {
      try {
        return await this.userCategoriesService.syncCategoriesWithSlugs(
          userId,
          dto.slugs,
        );
      } catch (e) {
        throw new BadRequestException();
      }
    }
    throw new BadRequestException(`required fields is missing`);
  }

  @ApiOperation({ description: '나의 관심사 리스트에 upsert' })
  @Patch(':userId/categories/:slug')
  async addCategoryWithSkill(
    @Param('userId') userId: number,
    @Param('slug') slug: string,
    @Body('skill') skill: number | null,
  ): Promise<Array<Interest>> {
    return await this.userCategoriesService.upsertCategoryWithSkill(
      userId,
      slug,
      skill,
    );
  }

  //? ----------------------------------------------------------------------- //
  //? READ
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '나의 관심사 리스트' })
  @Get(':userId/categories')
  async getCategories(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Array<Interest>> {
    return await this.userCategoriesService.getCategories(userId);
  }

  //? ----------------------------------------------------------------------- //
  //? Delete
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '나의 관심사 리스트에서 삭제' })
  @PaginateQueryOptions()
  @Delete(':userId/categories')
  async delete(
    @Param('userId') userId: number,
    @Body('ids') ids: number[],
  ): Promise<Array<Interest>> {
    try {
      return await this.userCategoriesService.removeCategories(userId, ids);
    } catch (e) {
      throw new BadRequestException();
    }
  }
}
