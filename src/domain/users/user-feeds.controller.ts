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
import { FlagsService } from 'src/domain/users/flags.service';
import { BookmarkUserFeedService } from 'src/domain/users/bookmark_user_feed.service';
import { BookmarkUserFeed } from 'src/domain/users/entities/bookmark_user_feed.entity';
import { AnyData } from 'src/common/types';
import { UserFeedsService } from 'src/domain/users/user-feeds.service';

@UseInterceptors(ClassSerializerInterceptor)
@SkipThrottle()
@Controller('users')
export class UserFeedsController {
  constructor(
    private readonly userFeedsService: UserFeedsService,
    private readonly flagsService: FlagsService,
    private readonly bookmarksService: BookmarkUserFeedService,
  ) {}

  //?-------------------------------------------------------------------------//
  //? 내가 만든 Feeds
  //?-------------------------------------------------------------------------//

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

  //?-------------------------------------------------------------------------//
  //? 내가 북마크(BookmarkUserFeed)한 Feeds
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Feed 북마크 생성' })
  @Post(':userId/feedbookmarks/:feedId')
  async createFeedBookmark(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('feedId', ParseIntPipe) feedId: number,
    @Body('message') message: string | null,
  ): Promise<BookmarkUserFeed> {
    return await this.bookmarksService.createFeedBookmark(
      userId,
      feedId,
      message,
    );
  }

  @ApiOperation({ description: 'Feed 북마크 삭제' })
  @Delete(':userId/feedbookmarks/:feedId')
  async deleteFeedBookmark(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('feedId', ParseIntPipe) feedId: number,
  ): Promise<any> {
    return await this.bookmarksService.deleteFeedBookmark(userId, feedId);
  }

  @ApiOperation({ description: 'Feed 북마크 여부' })
  @Get(':userId/feedbookmarks/:feedId')
  async isFeedBookmarked(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('feedId', ParseIntPipe) feedId: number,
  ): Promise<AnyData> {
    return {
      data: await this.bookmarksService.isFeedBookmarked(userId, feedId),
    };
  }

  @ApiOperation({ description: '내가 북마크한 Feeds (paginated)' })
  @PaginateQueryOptions()
  @Get(':userId/bookmarkedfeeds')
  async findBookmarkedFeedsByUserId(
    @Paginate() query: PaginateQuery,
    @Param('userId') userId: number,
  ): Promise<Paginated<Feed>> {
    return await this.bookmarksService.findBookmarkedFeeds(query, userId);
  }

  @ApiOperation({ description: '내가 북마크한 Feeds (all)' })
  @Get(':userId/bookmarkedfeeds/all')
  async loadBookmarkedFeeds(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Feed[]> {
    return await this.bookmarksService.loadBookmarkedFeeds(userId);
  }

  @ApiOperation({ description: '내가 북마크한 FeedIds' })
  @Get(':userId/bookmarkedfeedids')
  async loadBookmarkedFeedIds(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<number[]> {
    return await this.bookmarksService.loadBookmarkedFeedIds(userId);
  }

  //?-------------------------------------------------------------------------//
  //? 내가 신고한 Feeds
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Feed 신고 생성' })
  @Post(':userId/feedflags/:feedId')
  async createFeedFlag(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('feedId', ParseIntPipe) feedId: number,
    @Body('message') message: string | null,
  ): Promise<any> {
    return await this.flagsService.createFeedFlag(userId, feedId, message);
  }

  @ApiOperation({ description: 'Feed 신고 삭제' })
  @Delete(':userId/feedflags/:feedId')
  async deleteFeedFlag(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('feedId', ParseIntPipe) feedId: number,
  ): Promise<any> {
    return await this.flagsService.deleteFeedFlag(userId, feedId);
  }

  @ApiOperation({ description: 'Feed 신고 여부' })
  @Get(':userId/feedflags/:feedId')
  async isFeedFlagged(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('feedId', ParseIntPipe) feedId: number,
  ): Promise<AnyData> {
    return {
      data: await this.flagsService.isFeedFlagged(userId, feedId),
    };
  }

  @ApiOperation({ description: '내가 신고한 Feeds (paginated)' })
  @PaginateQueryOptions()
  @Get(':userId/flaggedfeeds')
  async findFlaggedFeedsByUserId(
    @Paginate() query: PaginateQuery,
    @Param('userId') userId: number,
  ): Promise<Paginated<Feed>> {
    return await this.flagsService.findFlaggedFeeds(query, userId);
  }

  @ApiOperation({ description: '내가 신고한 모든 Feeds (all)' })
  @Get(':userId/flaggedfeeds/all')
  async loadFlaggedFeeds(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Feed[]> {
    return await this.flagsService.loadFlaggedFeeds(userId);
  }

  @ApiOperation({ description: '내가 신고한 모든 FeedIds' })
  @Get(':userId/flaggedfeedids')
  async loadFlaggedFeedIds(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<number[]> {
    return await this.flagsService.loadFlaggedFeedIds(userId);
  }
}
