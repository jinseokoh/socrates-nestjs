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
import { FeedsService } from 'src/domain/feeds/feeds.service';
import { FlagsService } from 'src/domain/flags/flags.service';
import { BookmarkUserFeedService } from 'src/domain/users/bookmark_user_feed.service';

@UseInterceptors(ClassSerializerInterceptor)
@SkipThrottle()
@Controller('users')
export class UserFeedsController {
  constructor(
    private readonly feedsService: FeedsService,
    private readonly flagsService: FlagsService,
    private readonly bookmarkUserFeedService: BookmarkUserFeedService,
  ) {}

  //?-------------------------------------------------------------------------//
  //? 내가 만든
  //?-------------------------------------------------------------------------//

  //? 내가 만든 Feeds (paginated)
  @ApiOperation({ description: '내가 만든 Paginated<Feeds>' })
  @PaginateQueryOptions()
  @Get(':userId/feeds')
  async listMyFeeds(
    @Param('userId', ParseIntPipe) userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Feed>> {
    return await this.feedsService.findAllByUserId(query, userId);
  }

  //? 내가 만든 Feeds (all)
  @ApiOperation({ description: '내가 만든 Feeds' })
  @Get(':userId/feeds/all')
  async loadAllMyFeeds(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Feed[]> {
    return await this.feedsService.loadMyFeeds(userId);
  }

  //? 내가 만든 Feed ids (all)
  @ApiOperation({ description: '내가 만든 Feeds' })
  @Get(':userId/feeds/ids')
  async loadMyFeedIds(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<number[]> {
    return await this.feedsService.loadMyFeedIds(userId);
  }

  //?-------------------------------------------------------------------------//
  //? 내가 북마크한
  //?-------------------------------------------------------------------------//

  //? 내가 북마크한 Feeds (paginated)
  @ApiOperation({ description: '내가 북마크한 Feeds (paginated)' })
  @PaginateQueryOptions()
  @Get(':userId/bookmarked_feeds')
  async findBookmarkedFeedsByUserId(
    @Paginate() query: PaginateQuery,
    @Param('userId') userId: number,
  ): Promise<Paginated<Feed>> {
    return await this.bookmarkUserFeedService.findBookmarkedFeedsByUserId(
      query,
      userId,
    );
  }

  //? 내가 북마크한 FeedIds (all)
  @ApiOperation({ description: '내가 북마크한 FeedIds' })
  @Get(':userId/bookmared_feeds/ids')
  async loadBookmarkedFeedIds(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<number[]> {
    return await this.bookmarkUserFeedService.loadBookmarkedFeedIds(userId);
  }

  //?-------------------------------------------------------------------------//
  //? 내가 차단한
  //?-------------------------------------------------------------------------//

  //? 내가 차단한 Feeds (paginated)
  @ApiOperation({ description: '내가 차단한 Feeds (paginated)' })
  @PaginateQueryOptions()
  @Get(':userId/flagged_feeds')
  async findFlaggedFeedsByUserId(
    @Paginate() query: PaginateQuery,
    @Param('userId') userId: number,
  ): Promise<Paginated<Feed>> {
    return await this.flagsService.findFlaggedFeedsByUserId(query, userId);
  }

  //? 내가 차단한 FeedIds (all)
  @ApiOperation({ description: '내가 차단한 FeedIds' })
  @Get(':userId/feeds/ids')
  async loadFlaggedFeedIds(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<number[]> {
    return await this.flagsService.loadFlaggedFeedIds(userId);
  }
}
