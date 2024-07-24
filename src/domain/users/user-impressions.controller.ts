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
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
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

  @ApiOperation({ description: '첫인상 평가 데이터 추가' })
  @Post(':userId/impressions')
  async create(
    @CurrentUserId() recipientId: number,
    @Param('userId') userId: number,
    @Body() dto: CreateImpressionDto,
  ): Promise<AnyData> {
    try {
      const res = await this.usersService.upsertImpression({
        ...dto,
        recipientId,
        userId,
      });

      return {
        data: res,
      };
    } catch (e) {
      throw new BadRequestException();
    }
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '첫인상 평가 데이터' })
  @Get(':userId/impressions')
  async getUserImpressionsById(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<number[]> {
    return await this.usersService.getImpressionAverageById(userId);
  }
}
