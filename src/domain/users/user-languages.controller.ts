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
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { SyncLanguageDto } from 'src/domain/users/dto/sync-language.dto';
import { LanguageSkill } from 'src/domain/users/entities/language_skill.entity';
import { UserLanguagesService } from 'src/domain/users/user-languages.service';

@UseInterceptors(ClassSerializerInterceptor)
@SkipThrottle()
@Controller('users')
export class UserLanguagesController {
  constructor(private readonly userLanguagesService: UserLanguagesService) {}

  //? ----------------------------------------------------------------------- //
  //? Create
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '나의 언어 리스트에 추가' })
  @Post(':userId/languages')
  async syncLanguagesWithIds(
    @Param('userId') userId: number,
    @Body() dto: SyncLanguageDto,
  ): Promise<LanguageSkill[]> {
    if (dto.ids) {
      try {
        return await this.userLanguagesService.syncLanguagesWithIds(
          userId,
          dto.ids,
        );
      } catch (e) {
        throw new BadRequestException();
      }
    }
    if (dto.slugs) {
      try {
        return await this.userLanguagesService.syncLanguagesWithSlugs(
          userId,
          dto.slugs,
        );
      } catch (e) {
        throw new BadRequestException();
      }
    }
    if (dto.entities) {
      try {
        return await this.userLanguagesService.syncLanguagesWithEntities(
          userId,
          dto.entities,
        );
      } catch (e) {
        throw new BadRequestException();
      }
    }
  }

  @ApiOperation({ description: '나의 언어 리스트에 추가' })
  @Patch(':userId/languages/:slug')
  async addLanguageSkills(
    @Param('userId') userId: number,
    @Param('slug') slug: string,
    @Body('skill') skill: number | null,
  ): Promise<LanguageSkill[]> {
    return await this.userLanguagesService.upsertLanguageWithSkill(
      userId,
      slug,
      skill,
    );
  }

  //? ----------------------------------------------------------------------- //
  //? READ
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '나의 언어 리스트' })
  @Get(':userId/languages')
  async getLanguages(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<LanguageSkill[]> {
    return await this.userLanguagesService.getLanguages(userId);
  }

  //? ----------------------------------------------------------------------- //
  //? Delete
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '나의 언어 리스트에서 삭제' })
  @PaginateQueryOptions()
  @Delete(':userId/languages')
  async delete(
    @Param('userId') userId: number,
    @Body('ids') ids: number[],
  ): Promise<Array<LanguageSkill>> {
    try {
      return await this.userLanguagesService.removeLanguages(userId, ids);
    } catch (e) {
      throw new BadRequestException();
    }
  }
}
