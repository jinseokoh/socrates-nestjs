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
import { UserImpressionsService } from 'src/domain/users/user-impressions.service';

@UseInterceptors(ClassSerializerInterceptor)
@SkipThrottle()
@Controller('users')
export class UserImpressionsController {
  constructor(
    private readonly userImpressionsService: UserImpressionsService,
  ) {}

  //? ----------------------------------------------------------------------- //
  //? Create
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '첫인상 평가 데이터 추가' })
  @Post(':userId/impressions/:recipientId')
  async create(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('recipientId', ParseIntPipe) recipientId: number,
    @Body() dto: CreateImpressionDto,
  ): Promise<any> {
    console.log(dto);
    try {
      return await this.userImpressionsService.upsertImpression({
        ...dto,
        userId,
        recipientId,
      });
    } catch (e) {
      throw new BadRequestException();
    }
  }

  //? ----------------------------------------------------------------------- //
  //? READ
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '첫인상 평가 데이터' })
  @Get(':userId/impressions')
  async getUserImpressionsById(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<number[]> {
    return await this.userImpressionsService.getImpressionAverageById(userId);
  }
}
