import {
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
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { Feed } from 'src/domain/feeds/entities/feed.entity';
import { SkipThrottle } from '@nestjs/throttler';
import { UserFeedsService } from 'src/domain/users/user-feeds.service';
import { BookmarkUserFeed } from 'src/domain/users/entities/bookmark_user_feed.entity';
import { Flag } from 'src/domain/users/entities/flag.entity';

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
  //? 북마크/찜(BookmarkUserFeed) 생성
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'Feed 북마크/찜 생성' })
  @Post(':userId/bookmarkedfeeds/:feedId')
  async createFeedBookmark(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('feedId', ParseIntPipe) feedId: number,
  ): Promise<BookmarkUserFeed> {
    return await this.userFeedsService.createFeedBookmark(userId, feedId);
  }

  @ApiOperation({ description: 'Feed 북마크/찜 삭제' })
  @Delete(':userId/bookmarkedfeeds/:feedId')
  async deleteFeedBookmark(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('feedId', ParseIntPipe) feedId: number,
  ): Promise<any> {
    return await this.userFeedsService.deleteFeedBookmark(userId, feedId);
  }

  @ApiOperation({ description: 'Feed 북마크/찜 여부' })
  @Get(':userId/bookmarkedfeeds/:feedId')
  async isFeedBookmarked(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('feedId', ParseIntPipe) feedId: number,
  ): Promise<boolean> {
    return await this.userFeedsService.isFeedBookmarked(userId, feedId);
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
  //? Feed Flag 신고 생성
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'Feed 신고 생성' })
  @Post(':userId/flaggedfeeds/:feedId')
  async createFeedFlag(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('feedId', ParseIntPipe) feedId: number,
    @Body('message') message: string | null,
  ): Promise<Flag> {
    return await this.userFeedsService.createFeedFlag(userId, feedId, message);
  }

  @ApiOperation({ description: 'Feed 신고 삭제' })
  @Delete(':userId/flaggedfeeds/:feedId')
  async deleteFeedFlag(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('feedId', ParseIntPipe) feedId: number,
  ): Promise<any> {
    return await this.userFeedsService.deleteFeedFlag(userId, feedId);
  }

  @ApiOperation({ description: 'Feed 신고 여부' })
  @Get(':userId/flaggedfeeds/:feedId')
  async isFeedFlagged(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('feedId', ParseIntPipe) feedId: number,
  ): Promise<boolean> {
    return await this.userFeedsService.isFeedFlagged(userId, feedId);
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
