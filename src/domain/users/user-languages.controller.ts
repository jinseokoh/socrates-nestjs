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
import { LanguageSkillDto } from 'src/domain/users/dto/language-skill.dto';
import { Interest } from 'src/domain/users/entities/interest.entity';
import { LanguageSkill } from 'src/domain/users/entities/language_skill.entity';
import { UsersService } from 'src/domain/users/users.service';

@UseInterceptors(ClassSerializerInterceptor)
@SkipThrottle()
@Controller('users')
export class UserLanguagesController {
  constructor(private readonly usersService: UsersService) {}

  //?-------------------------------------------------------------------------//
  //? Create
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '나의 관심사 리스트에 추가' })
  @Post(':userId/languages')
  async addLanguageSkill(
    @Param('userId') userId: number,
    @Body() dto: LanguageSkillDto,
  ): Promise<void> {
    try {
      return await this.usersService.upsertLanguageSkill(dto.skills);
    } catch (e) {
      throw new BadRequestException();
    }
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '나의 관심사 리스트' })
  @Get(':userId/languages')
  async getLanguages(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Array<LanguageSkill>> {
    return await this.usersService.getLanguageSkills(userId);
  }

  //?-------------------------------------------------------------------------//
  //? Delete
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '나의 관심사 리스트에서 삭제' })
  @PaginateQueryOptions()
  @Delete(':userId/languages')
  async delete(
    @Param('userId') userId: number,
    @Body('ids') ids: number[],
  ): Promise<Array<LanguageSkill>> {
    try {
      return await this.usersService.removeLanguages(userId, ids);
    } catch (e) {
      throw new BadRequestException();
    }
  }
}
