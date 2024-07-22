import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { AnyData } from 'src/common/types';
import { MeetupsService } from 'src/domain/meetups/meetups.service';
import { BookmarkUserMeetupService } from 'src/domain/users/bookmark_user_meetup.service';
import { User } from 'src/domain/users/entities/user.entity';
import { FlagMeetupService } from 'src/domain/users/flag_meetup.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('meetups')
export class MeetupUsersController {
  constructor(
    private readonly meetupsService: MeetupsService,
    private readonly bookmarksService: BookmarkUserMeetupService,
    private readonly flagMeetupService: FlagMeetupService,
  ) {}

  //! ----------------------------------------------------------------------- //
  //! 참가신청 리스트
  //! ----------------------------------------------------------------------- //

  @ApiOperation({ description: '이 모임에 신청한 사용자 리스트 (최대30명)' })
  @Get(':id/joiners')
  async getAllJoiners(@Param('id', ParseIntPipe) id: number): Promise<AnyData> {
    const users = await this.meetupsService.getAllJoiners(id);
    return {
      data: users,
    };
  }

  @ApiOperation({ description: '이 모임에 초대한 사용자 리스트 (최대30명)' })
  @Get(':id/invitees')
  async getAllInvitees(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AnyData> {
    const users = await this.meetupsService.getAllInvitees(id);
    return {
      data: users,
    };
  }

  //?-------------------------------------------------------------------------//
  //? 북마크 (BookmarkUserMeetup) 리스트
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '이 모임을 북마크/찜한 모든 Users' })
  @Get(':meetupId/bookmarkingusers')
  async loadBookmarkingUsers(
    @Param('meetupId', ParseIntPipe) meetupId: number,
  ): Promise<User[]> {
    return await this.bookmarksService.loadBookmarkingUsers(meetupId);
  }

  @ApiOperation({ description: '이 모임을 북마크/찜한 모든 UserIds' })
  @Get(':meetupId/bookmarkinguserids')
  async loadBookmarkingUserIds(
    @Param('meetupId', ParseIntPipe) meetupId: number,
  ): Promise<number[]> {
    return await this.bookmarksService.loadBookmarkingUserIds(meetupId);
  }

  //?-------------------------------------------------------------------------//
  //? 신고 (Flag) 리스트
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '이 모임을 신고한 모든 Users (all)' })
  @Get(':meetupId/flaggingusers')
  async loadFlaggingUsers(
    @Param('meetupId', ParseIntPipe) meetupId: number,
  ): Promise<User[]> {
    return await this.flagMeetupService.loadMeetupFlaggingUsers(meetupId);
  }

  @ApiOperation({ description: '이 모임을 신고한 모든 Users (all)' })
  @Get(':meetupId/flagginguserids')
  async loadFlaggingUserIds(
    @Param('meetupId', ParseIntPipe) meetupId: number,
  ): Promise<number[]> {
    return await this.flagMeetupService.loadMeetupFlaggingUserIds(meetupId);
  }
}
