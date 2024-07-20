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
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { Feed } from 'src/domain/feeds/entities/feed.entity';
import { SkipThrottle } from '@nestjs/throttler';
import { UsersFeedService } from 'src/domain/users/users-feed.service';

@UseInterceptors(ClassSerializerInterceptor)
@SkipThrottle()
@Controller('users')
export class UserFeedsController {
  constructor(private readonly usersFeedService: UsersFeedService) {}

  //?-------------------------------------------------------------------------//
  //? 내가 만든 발견 리스트
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '내가 만든 발견 리스트 (paginated)' })
  @PaginateQueryOptions()
  @Get(':userId/feeds')
  async listMyFeeds(
    @Param('userId', ParseIntPipe) userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Feed>> {
    return await this.usersFeedService.listMyFeeds(userId, query);
  }

  @ApiOperation({ description: '내가 만든 발견 리스트 (all)' })
  @Get(':userId/feeds/all')
  async loadMyFeeds(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Feed[]> {
    return await this.usersFeedService.loadMyFeeds(userId);
  }

  //?-------------------------------------------------------------------------//
  //? ReportUserFeed Pivot
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '차단한 발견 리스트에 추가' })
  @Post(':userId/feeds-reported/:feedId')
  async attachToFeedReportPivot(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('feedId', ParseIntPipe) feedId: number,
    @Body('message') message: string,
  ): Promise<any> {
    //? checking if this feed belongs to the user costs a database access,
    //? which you can get around if you design your application carefully.
    //? so user validation has been removed. keep that in mind.
    try {
      await this.usersFeedService.attachToReportUserFeedPivot(
        userId,
        feedId,
        message,
      );

      return {
        data: 'ok',
      };
    } catch (e) {
      throw new BadRequestException();
    }
  }

  @ApiOperation({ description: '차단한 발견 리스트에서 삭제' })
  @Delete(':userId/feeds-reported/:feedId')
  async detachFromFeedReportPivot(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('feedId', ParseIntPipe) feedId: number,
  ): Promise<any> {
    //? checking if this feed belongs to the user costs a database access,
    //? which you can get around if you design your application carefully.
    //? so user validation has been removed. keep that in mind.
    try {
      await this.usersFeedService.detachFromReportUserFeedPivot(userId, feedId);
      return {
        data: 'ok',
      };
    } catch (e) {
      throw new BadRequestException();
    }
  }


  @ApiOperation({ description: '내가 차단한 발견ID 리스트 (all)' })
  @PaginateQueryOptions()
  @Get(':userId/feedids-reported')
  async getFeedIdsReportedByMe(
    @Param('userId') userId: number,
  ): Promise<AnyData> {
    const data = await this.usersFeedService.getFeedIdsReportedByMe(userId);
    return {
      data,
    };
  }
}
