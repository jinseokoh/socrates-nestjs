import {
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
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { FeedUsersService } from 'src/domain/feeds/feed-users.service';
import { BookmarkUserFeed } from 'src/domain/users/entities/bookmark_user_feed.entity';
import { User } from 'src/domain/users/entities/user.entity';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('feeds')
export class FeedUsersController {
  constructor(private readonly feedUsersService: FeedUsersService) {}

  //? ----------------------------------------------------------------------- //
  //? 북마크/찜(BookmarkUserFeed) 생성
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'Feed 북마크/찜 생성' })
  @Post(':feedId/bookmark')
  async createFeedBookmark(
    @CurrentUserId() userId: number,
    @Param('feedId', ParseIntPipe) feedId: number,
  ): Promise<BookmarkUserFeed> {
    return await this.feedUsersService.createFeedBookmark(userId, feedId);
  }

  @ApiOperation({ description: 'Feed 북마크/찜 삭제' })
  @Delete(':feedId/bookmark')
  async deleteFeedBookmark(
    @CurrentUserId() userId: number,
    @Param('feedId', ParseIntPipe) feedId: number,
  ): Promise<any> {
    return await this.feedUsersService.deleteFeedBookmark(userId, feedId);
  }

  @ApiOperation({ description: 'Feed 북마크/찜 여부' })
  @Get(':feedId/bookmark')
  async isFeedBookmarked(
    @CurrentUserId() userId: number,
    @Param('feedId', ParseIntPipe) feedId: number,
  ): Promise<boolean> {
    return await this.feedUsersService.isFeedBookmarked(userId, feedId);
  }

  //? ----------------------------------------------------------------------- //
  //? 북마크 (BookmarkUserFeed) 리스트
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '이 Feed 를 북마크한 모든 Users' })
  @Get(':feedId/bookmarkers')
  async loadBookmarkingUsers(
    @Param('feedId', ParseIntPipe) feedId: number,
  ): Promise<User[]> {
    return await this.feedUsersService.loadBookmarkingUsers(feedId);
  }

  @ApiOperation({ description: '이 Feed 를 북마크한 모든 UserIds' })
  @Get(':feedId/bookmarkerids')
  async loadBookmarkingUserIds(
    @Param('feedId', ParseIntPipe) feedId: number,
  ): Promise<number[]> {
    return await this.feedUsersService.loadBookmarkingUserIds(feedId);
  }

  //? ----------------------------------------------------------------------- //
  //? 신고 (Flag) 리스트
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '이 모임을 신고한 모든 Users (all)' })
  @Get(':feedId/flaggers')
  async loadFlaggingUsers(
    @Param('feedId', ParseIntPipe) feedId: number,
  ): Promise<User[]> {
    return await this.feedUsersService.loadFeedFlaggingUsers(feedId);
  }

  @ApiOperation({ description: '이 모임을 신고한 모든 Users (all)' })
  @Get(':feedId/flaggerids')
  async loadFlaggingUserIds(
    @Param('feedId', ParseIntPipe) feedId: number,
  ): Promise<number[]> {
    return await this.feedUsersService.loadFeedFlaggingUserIds(feedId);
  }
}
