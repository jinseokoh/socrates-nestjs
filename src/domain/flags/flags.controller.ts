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
import { SkipThrottle } from '@nestjs/throttler';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { AnyData } from 'src/common/types';
import { Flag } from 'src/domain/flags/entities/flag.entity';
import { CreateFlagDto } from 'src/domain/flags/dto/create-flag.dto';
import { FlagsService } from 'src/domain/flags/flags.service';

@UseInterceptors(ClassSerializerInterceptor)
@SkipThrottle()
@Controller('users')
export class FlagsController {
  constructor(private readonly flagService: FlagsService) {}

  //?-------------------------------------------------------------------------//
  //? Flag Pivot
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '나의 북마크에서 feed 추가' })
  @Post(':userId/flags')
  async create(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: CreateFlagDto,
  ): Promise<any> {
    //? checking if this meetup belongs to the user costs a database access,
    //? which you can get around if you design your application carefully.
    //? so user validation has been removed. keep that in mind.
    try {
      return await this.flagService.createFlag(userId, dto);
    } catch (e) {
      throw new BadRequestException();
    }
  }

  @ApiOperation({ description: '나의 북마크에서 feed 제거' })
  @Delete(':userId/flags')
  async delete(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: CreateFlagDto,
  ): Promise<any> {
    //? checking if this meetup belongs to the user costs a database access,
    //? which you can get around if you design your application carefully.
    //? so user validation has been removed. keep that in mind.
    try {
      return await this.flagService.deleteFlag(userId, dto);
    } catch (e) {
      throw new BadRequestException();
    }
  }

  @ApiOperation({ description: '내가 북마크한 feed 리스트 (paginated)' })
  @Get(':userId/flags/:entityType')
  async getUsersReportedByMe(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('entityType') entityType: string,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Flag>> {
    return this.flagService.getFlagsByUserId(query, userId, entityType);
  }

  // @ApiOperation({ description: '내가 북마크한 feedIds 리스트' })
  // @Get(':userId/flags/ids')
  // async getAllUserIdsReportedByMe(
  //   @Param('userId', ParseIntPipe) userId: number,
  // ): Promise<number[]> {
  //   return await this.flagService.getAllIdsReportedByMe(userId);
  // }

  @ApiOperation({
    description: '내가 북마크한 feed 여부',
  })
  @Get(':userId/flags/:entity')
  async isReported(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('entity', ParseIntPipe) entity: string,
  ): Promise<AnyData> {
    const [entityType, entityId] = entity.split(',');
    return this.flagService.isReported(userId, entityType, +entityId);
  }
}
