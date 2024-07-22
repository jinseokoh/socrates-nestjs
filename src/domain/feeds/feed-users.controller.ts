import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { FeedsService } from 'src/domain/feeds/feeds.service';
import { BookmarkUserFeedService } from 'src/domain/users/bookmark_user_feed.service';
import { User } from 'src/domain/users/entities/user.entity';
import { FlagFeedService } from 'src/domain/users/flag_feed.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('feeds')
export class FeedUsersController {
  constructor(
    private readonly feedsService: FeedsService,
    private readonly bookmarksService: BookmarkUserFeedService,
    private readonly flagFeedService: FlagFeedService,
  ) {}

  //?-------------------------------------------------------------------------//
  //? 요청 (Plea) 리스트
  //?-------------------------------------------------------------------------//

  // @ApiOperation({ description: '이 모임에 신청한 사용자 리스트 (최대30명)' })
  // @Get(':id/joiners')
  // async getAllJoiners(@Param('id', ParseIntPipe) id: number): Promise<AnyData> {
  //   const users = await this.feedsService.getAllJoiners(id);
  //   return {
  //     data: users,
  //   };
  // }

  // @ApiOperation({ description: '이 모임에 초대한 사용자 리스트 (최대30명)' })
  // @Get(':id/invitees')
  // async getAllInvitees(
  //   @Param('id', ParseIntPipe) id: number,
  // ): Promise<AnyData> {
  //   const users = await this.feedsService.getAllInvitees(id);
  //   return {
  //     data: users,
  //   };
  // }

  //?-------------------------------------------------------------------------//
  //? 북마크 (BookmarkUserFeed) 리스트
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '이 Feed 를 북마크한 모든 Users' })
  @Get(':feedId/bookmarkingusers')
  async loadBookmarkingUsers(
    @Param('feedId', ParseIntPipe) feedId: number,
  ): Promise<User[]> {
    return await this.bookmarksService.loadBookmarkingUsers(feedId);
  }

  @ApiOperation({ description: '이 Feed 를 북마크한 모든 UserIds' })
  @Get(':feedId/bookmarkinguserids')
  async loadBookmarkingUserIds(
    @Param('feedId', ParseIntPipe) feedId: number,
  ): Promise<number[]> {
    return await this.bookmarksService.loadBookmarkingUserIds(feedId);
  }

  //?-------------------------------------------------------------------------//
  //? 신고 (Flag) 리스트
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '이 모임을 신고한 모든 Users (all)' })
  @Get(':feedId/flaggingusers')
  async loadFlaggingUsers(
    @Param('feedId', ParseIntPipe) feedId: number,
  ): Promise<User[]> {
    return await this.flagFeedService.loadFeedFlaggingUsers(feedId);
  }

  @ApiOperation({ description: '이 모임을 신고한 모든 Users (all)' })
  @Get(':feedId/flagginguserids')
  async loadFlaggingUserIds(
    @Param('feedId', ParseIntPipe) feedId: number,
  ): Promise<number[]> {
    return await this.flagFeedService.loadFeedFlaggingUserIds(feedId);
  }
}
