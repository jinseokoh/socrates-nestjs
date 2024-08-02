import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { Feed } from 'src/domain/feeds/entities/feed.entity';
import { SkipThrottle } from '@nestjs/throttler';
import { UserFeedsService } from 'src/domain/users/user-feeds.service';

@UseInterceptors(ClassSerializerInterceptor)
@SkipThrottle()
@Controller('users')
export class UserFeedsController {
  constructor(private readonly userFeedsService: UserFeedsService) {}

  //? ----------------------------------------------------------------------- //
  //? 내가 만든 Feeds
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '내가 만든 Feeds (paginated)' })
  @PaginateQueryOptions()
  @Get(':userId/feeds')
  async findMyFeeds(
    @Param('userId', ParseIntPipe) userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Feed>> {
    return await this.userFeedsService.findMyFeeds(query, userId);
  }

  @ApiOperation({ description: '내가 만든 Feeds (all)' })
  @Get(':userId/feeds/all')
  async loadAllMyFeeds(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Feed[]> {
    return await this.userFeedsService.loadMyFeeds(userId);
  }

  @ApiOperation({ description: '내가 만든 FeedIds' })
  @Get(':userId/feedids')
  async loadMyFeedIds(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<number[]> {
    return await this.userFeedsService.loadMyFeedIds(userId);
  }

  //? ----------------------------------------------------------------------- //
  //? 내가 북마크(BookmarkUserFeed)한 Feeds
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '내가 북마크한 Feeds (paginated)' })
  @PaginateQueryOptions()
  @Get(':userId/bookmarkedfeeds')
  async findBookmarkedFeedsByUserId(
    @Paginate() query: PaginateQuery,
    @Param('userId') userId: number,
  ): Promise<Paginated<Feed>> {
    return await this.userFeedsService.findBookmarkedFeeds(query, userId);
  }

  @ApiOperation({ description: '내가 북마크한 Feeds (all)' })
  @Get(':userId/bookmarkedfeeds/all')
  async loadBookmarkedFeeds(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Feed[]> {
    return await this.userFeedsService.loadBookmarkedFeeds(userId);
  }

  @ApiOperation({ description: '내가 북마크한 FeedIds' })
  @Get(':userId/bookmarkedfeedids')
  async loadBookmarkedFeedIds(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<number[]> {
    return await this.userFeedsService.loadBookmarkedFeedIds(userId);
  }

  //? ----------------------------------------------------------------------- //
  //? 내가 신고한 Feeds
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '내가 신고한 Feeds (paginated)' })
  @PaginateQueryOptions()
  @Get(':userId/flaggedfeeds')
  async findFlaggedFeedsByUserId(
    @Paginate() query: PaginateQuery,
    @Param('userId') userId: number,
  ): Promise<Paginated<Feed>> {
    return await this.userFeedsService.findFlaggedFeeds(query, userId);
  }

  @ApiOperation({ description: '내가 신고한 모든 Feeds (all)' })
  @Get(':userId/flaggedfeeds/all')
  async loadFlaggedFeeds(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Feed[]> {
    return await this.userFeedsService.loadFlaggedFeeds(userId);
  }

  @ApiOperation({ description: '내가 신고한 모든 FeedIds' })
  @Get(':userId/flaggedfeedids')
  async loadFlaggedFeedIds(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<number[]> {
    return await this.userFeedsService.loadFlaggedFeedIds(userId);
  }
}
