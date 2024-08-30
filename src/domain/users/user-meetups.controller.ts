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
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { SkipThrottle } from '@nestjs/throttler';
import { UserMeetupsService } from 'src/domain/users/user-meetups.service';
import { Bookmark } from 'src/domain/users/entities/bookmark.entity';
import { Flag } from 'src/domain/users/entities/flag.entity';
import { Like } from 'src/domain/users/entities/like.entity';

@UseInterceptors(ClassSerializerInterceptor)
@SkipThrottle()
@Controller('users')
export class UserMeetupsController {
  constructor(private readonly userMeetupsService: UserMeetupsService) {}

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
  async loadMyMeetups(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Meetup[]> {
    return await this.userMeetupsService.loadMyMeetups(userId);
  }

  @ApiOperation({ description: '내가 만든 MeetupIds' })
  @Get(':userId/meetups/ids')
  async loadMyMeetupIds(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<number[]> {
    return await this.userMeetupsService.loadMyMeetupIds(userId);
  }

  //? ----------------------------------------------------------------------- //
  //? 북마크/찜(Bookmark) 생성
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'Meetup 북마크/찜 생성' })
  @Post(':userId/meetups/:meetupId/bookmark')
  async createMeetupBookmark(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
  ): Promise<Bookmark> {
    return await this.userMeetupsService.createMeetupBookmark(userId, meetupId);
  }

  @ApiOperation({ description: 'Meetup 북마크/찜 삭제' })
  @Delete(':userId/meetups/:meetupId/bookmark')
  async deleteMeetupBookmark(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
  ): Promise<any> {
    return await this.userMeetupsService.deleteMeetupBookmark(userId, meetupId);
  }

  @ApiOperation({ description: 'Meetup 북마크/찜 여부' })
  @Get(':userId/meetups/:meetupId/bookmark')
  async isMeetupBookmarked(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
  ): Promise<boolean> {
    return await this.userMeetupsService.isMeetupBookmarked(userId, meetupId);
  }

  @ApiOperation({ description: '내가 북마크/찜한 Meetups (paginated)' })
  @PaginateQueryOptions()
  @Get(':userId/bookmarked-meetups')
  async listBookmarkedMeetups(
    @Paginate() query: PaginateQuery,
    @Param('userId') userId: number,
  ): Promise<Paginated<Meetup>> {
    return await this.userMeetupsService.listBookmarkedMeetups(query, userId);
  }

  @ApiOperation({ description: '내가 북마크/찜한 Meetups (all)' })
  @Get(':userId/bookmarked-meetups/all')
  async loadBookmarkedMeetups(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Meetup[]> {
    return await this.userMeetupsService.loadBookmarkedMeetups(userId);
  }

  @ApiOperation({ description: '내가 북마크/찜한 MeetupIds' })
  @Get(':userId/bookmarked-meetups/ids')
  async loadBookmarkedMeetupIds(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<number[]> {
    return await this.userMeetupsService.loadBookmarkedMeetupIds(userId);
  }

  //? ----------------------------------------------------------------------- //
  //? Meetup Like 신고 생성
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'Meetup 신고 생성' })
  @Post(':userId/meetups/:meetupId/like')
  async createMeetupLike(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
  ): Promise<Like> {
    return await this.userMeetupsService.createMeetupLike(userId, meetupId);
  }

  @ApiOperation({ description: 'Meetup 신고 삭제' })
  @Delete(':userId/meetups/:meetupId/like')
  async deleteMeetupLike(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
  ): Promise<any> {
    return await this.userMeetupsService.deleteMeetupLike(userId, meetupId);
  }

  @ApiOperation({ description: 'Meetup 신고 여부' })
  @Get(':userId/meetups/:meetupId/like')
  async isMeetupLiked(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
  ): Promise<boolean> {
    return await this.userMeetupsService.isMeetupLiked(userId, meetupId);
  }

  @ApiOperation({ description: '내가 신고한 Meetups (paginated)' })
  @PaginateQueryOptions()
  @Get(':userId/liked-meetups')
  async listLikedMeetupsByUserId(
    @Paginate() query: PaginateQuery,
    @Param('userId') userId: number,
  ): Promise<Paginated<Meetup>> {
    return await this.userMeetupsService.listLikedMeetups(query, userId);
  }

  @ApiOperation({ description: '내가 신고한 모든 Meetups (all)' })
  @Get(':userId/liked-meetups/all')
  async loadLikedMeetups(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Meetup[]> {
    return await this.userMeetupsService.loadLikedMeetups(userId);
  }

  @ApiOperation({ description: '내가 신고한 모든 MeetupIds' })
  @Get(':userId/liked-meetups/ids')
  async loadLikedMeetupIds(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<number[]> {
    return await this.userMeetupsService.loadLikedMeetupIds(userId);
  }

  //? ----------------------------------------------------------------------- //
  //? Meetup Flag 신고 생성
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'Meetup 신고 생성' })
  @Post(':userId/meetups/:meetupId/flag')
  async createMeetupFlag(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Body('message') message: string | null,
  ): Promise<Flag> {
    return await this.userMeetupsService.createMeetupFlag(
      userId,
      meetupId,
      message,
    );
  }

  @ApiOperation({ description: 'Meetup 신고 삭제' })
  @Delete(':userId/meetups/:meetupId/flag')
  async deleteMeetupFlag(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
  ): Promise<any> {
    return await this.userMeetupsService.deleteMeetupFlag(userId, meetupId);
  }

  @ApiOperation({ description: 'Meetup 신고 여부' })
  @Get(':userId/meetups/:meetupId/flag')
  async isMeetupFlagged(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
  ): Promise<boolean> {
    return await this.userMeetupsService.isMeetupFlagged(userId, meetupId);
  }

  @ApiOperation({ description: '내가 신고한 Meetups (paginated)' })
  @PaginateQueryOptions()
  @Get(':userId/flagged-meetups')
  async listFlaggedMeetupsByUserId(
    @Paginate() query: PaginateQuery,
    @Param('userId') userId: number,
  ): Promise<Paginated<Meetup>> {
    return await this.userMeetupsService.listFlaggedMeetups(query, userId);
  }

  @ApiOperation({ description: '내가 신고한 모든 Meetups (all)' })
  @Get(':userId/flagged-meetups/all')
  async loadFlaggedMeetups(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Meetup[]> {
    return await this.userMeetupsService.loadFlaggedMeetups(userId);
  }

  @ApiOperation({ description: '내가 신고한 모든 MeetupIds' })
  @Get(':userId/flagged-meetups/ids')
  async loadFlaggedMeetupIds(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<number[]> {
    return await this.userMeetupsService.loadFlaggedMeetupIds(userId);
  }
}
