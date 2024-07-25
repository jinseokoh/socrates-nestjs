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
import { AnyData } from 'src/common/types';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { SkipThrottle } from '@nestjs/throttler';
import { UserMeetupsService } from 'src/domain/users/user-meetups.service';
import { FlagMeetupService } from 'src/domain/users/flag_meetup.service';
import { BookmarkUserMeetupService } from 'src/domain/users/bookmark_user_meetup.service';
import { BookmarkUserMeetup } from 'src/domain/users/entities/bookmark_user_meetup.entity';

@UseInterceptors(ClassSerializerInterceptor)
@SkipThrottle()
@Controller('users')
export class UserMeetupsController {
  constructor(
    private readonly userMeetupsService: UserMeetupsService,
    private readonly flagsService: FlagMeetupService,
    private readonly bookmarksService: BookmarkUserMeetupService,
  ) {}

  //? ----------------------------------------------------------------------- //
  //? 내가 만든 Meetups
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '내가 만든 Meetups (paginated)' })
  @PaginateQueryOptions()
  @Get(':userId/meetups')
  async findMyMeetups(
    @Paginate() query: PaginateQuery,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Paginated<Meetup>> {
    return await this.userMeetupsService.findMyMeetups(query, userId);
  }

  @ApiOperation({ description: '내가 만든 Meetups (all)' })
  @Get(':userId/meetups/all')
  async loadAllMyMeetups(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Meetup[]> {
    return await this.userMeetupsService.loadMyMeetups(userId);
  }

  @ApiOperation({ description: '내가 만든 MeetupIds' })
  @Get(':userId/meetupids')
  async loadMyMeetupIds(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<number[]> {
    return await this.userMeetupsService.loadMyMeetupIds(userId);
  }

  //? ----------------------------------------------------------------------- //
  //? 내가 북마크/찜(BookmarkUserMeetup)한 Meetups
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'Meetup 북마크/찜 생성' })
  @Post(':userId/meetupbookmarks/:meetupId')
  async createMeetupBookmark(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
  ): Promise<BookmarkUserMeetup> {
    return await this.bookmarksService.createMeetupBookmark(userId, meetupId);
  }

  @ApiOperation({ description: 'Meetup 북마크/찜 삭제' })
  @Delete(':userId/meetupbookmarks/:meetupId')
  async deleteMeetupBookmark(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
  ): Promise<any> {
    return await this.bookmarksService.deleteMeetupBookmark(userId, meetupId);
  }

  @ApiOperation({ description: 'Meetup 북마크/찜 여부' })
  @Get(':userId/meetupbookmarks/:meetupId')
  async isMeetupBookmarked(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
  ): Promise<AnyData> {
    return {
      data: await this.bookmarksService.isMeetupBookmarked(userId, meetupId),
    };
  }

  @ApiOperation({ description: '내가 북마크/찜한 Meetups (paginated)' })
  @PaginateQueryOptions()
  @Get(':userId/bookmarkedmeetups')
  async findBookmarkedMeetups(
    @Paginate() query: PaginateQuery,
    @Param('userId') userId: number,
  ): Promise<Paginated<Meetup>> {
    return await this.bookmarksService.findBookmarkedMeetups(query, userId);
  }

  @ApiOperation({ description: '내가 북마크/찜한 Meetups (all)' })
  @Get(':userId/bookmarkedmeetups/all')
  async loadBookmarkedMeetups(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Meetup[]> {
    return await this.bookmarksService.loadBookmarkedMeetups(userId);
  }

  @ApiOperation({ description: '내가 북마크/찜한 MeetupIds' })
  @Get(':userId/bookmarkedmeetupids')
  async loadBookmarkedMeetupIds(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<number[]> {
    return await this.bookmarksService.loadBookmarkedMeetupIds(userId);
  }

  //? ----------------------------------------------------------------------- //
  //? 내가 신고한 Meetups
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'Meetup 신고 생성' })
  @Post(':userId/meetupflags/:meetupId')
  async createMeetupFlag(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Body('message') message: string | null,
  ): Promise<any> {
    return await this.flagsService.createMeetupFlag(userId, meetupId, message);
  }

  @ApiOperation({ description: 'Meetup 신고 삭제' })
  @Delete(':userId/meetupflags/:meetupId')
  async deleteMeetupFlag(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
  ): Promise<any> {
    return await this.flagsService.deleteMeetupFlag(userId, meetupId);
  }

  @ApiOperation({ description: 'Meetup 신고 여부' })
  @Get(':userId/meetupflags/:meetupId')
  async isMeetupFlagged(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
  ): Promise<AnyData> {
    return {
      data: await this.flagsService.isMeetupFlagged(userId, meetupId),
    };
  }

  @ApiOperation({ description: '내가 신고한 Meetups (paginated)' })
  @PaginateQueryOptions()
  @Get(':userId/flaggedmeetups')
  async findFlaggedMeetupsByUserId(
    @Paginate() query: PaginateQuery,
    @Param('userId') userId: number,
  ): Promise<Paginated<Meetup>> {
    return await this.flagsService.findFlaggedMeetups(query, userId);
  }

  @ApiOperation({ description: '내가 신고한 모든 Meetups (all)' })
  @Get(':userId/flaggedmeetups/all')
  async loadFlaggedMeetups(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Meetup[]> {
    return await this.flagsService.loadFlaggedMeetups(userId);
  }

  @ApiOperation({ description: '내가 신고한 모든 MeetupIds' })
  @Get(':userId/flaggedmeetupids')
  async loadFlaggedMeetupIds(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<number[]> {
    return await this.flagsService.loadFlaggedMeetupIds(userId);
  }
}
