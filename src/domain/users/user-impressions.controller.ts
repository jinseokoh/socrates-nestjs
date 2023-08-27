import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { AnyData } from 'src/common/types';
import { CreateImpressionDto } from 'src/domain/users/dto/create-impression.dto';
import { UsersService } from 'src/domain/users/users.service';

@UseInterceptors(ClassSerializerInterceptor)
@SkipThrottle()
@Controller('users')
export class UserImpressionsController {
  constructor(private readonly usersService: UsersService) {}

  //?-------------------------------------------------------------------------//
  //? Create
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '나의 관심사 리스트에 추가' })
  @Post(':userId/impressions')
  async create(
    @Param('userId') userId: number,
    @Body() dto: CreateImpressionDto,
  ): Promise<AnyData> {
    try {
      const data = await this.usersService.createImpression(userId, dto);
      return {
        data: data,
      };
    } catch (e) {
      throw new BadRequestException();
    }
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '나의 관심사 리스트' })
  @Get(':userId/impressions')
  async getUserImpressionsById(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<number[]> {
    return await this.usersService.findUserImpressionsById(userId);
  }
}
