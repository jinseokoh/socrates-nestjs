import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { MeetupUsersService } from 'src/domain/meetups/meetup-users.service';
import { Join } from 'src/domain/meetups/entities/join.entity';
import { User } from 'src/domain/users/entities/user.entity';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('meetups')
export class MeetupUsersController {
  constructor(private readonly meetupUsersService: MeetupUsersService) {}

  //? ----------------------------------------------------------------------- //
  //? 참가 신청/초대 (Join) 리스트
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '이 모임에 신청한 사용자 리스트' })
  @Get(':meetupId/requesters')
  async loadAllJoiners(
    @Param('meetupId', ParseIntPipe) meetupId: number,
  ): Promise<Join[]> {
    return await this.meetupUsersService.loadAllJoiners(meetupId);
  }

  @ApiOperation({ description: '이 모임에 초대한 사용자 리스트' })
  @Get(':meetupId/invitees')
  async loadAllInvitees(
    @Param('meetupId', ParseIntPipe) meetupId: number,
  ): Promise<Join[]> {
    return await this.meetupUsersService.loadAllInvitees(meetupId);
  }

  //? ----------------------------------------------------------------------- //
  //? 북마크 (BookmarkUserMeetup) 리스트
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '이 모임을 북마크/찜한 모든 Users' })
  @Get(':meetupId/bookmarkers')
  async loadBookmarkers(
    @Param('meetupId', ParseIntPipe) meetupId: number,
  ): Promise<User[]> {
    return await this.meetupUsersService.loadBookmarkers(meetupId);
  }

  @ApiOperation({ description: '이 모임을 북마크/찜한 모든 UserIds' })
  @Get(':meetupId/bookmarkerids')
  async loadBookmarkerIds(
    @Param('meetupId', ParseIntPipe) meetupId: number,
  ): Promise<number[]> {
    return await this.meetupUsersService.loadBookmarkerIds(meetupId);
  }

  //? ----------------------------------------------------------------------- //
  //? 신고 (Flag) 리스트
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '이 모임을 신고한 모든 Users (all)' })
  @Get(':meetupId/flaggers')
  async loadFlaggingUsers(
    @Param('meetupId', ParseIntPipe) meetupId: number,
  ): Promise<User[]> {
    return await this.meetupUsersService.loadMeetupFlaggingUsers(meetupId);
  }

  @ApiOperation({ description: '이 모임을 신고한 모든 UserIds (all)' })
  @Get(':meetupId/flaggerids')
  async loadFlaggingUserIds(
    @Param('meetupId', ParseIntPipe) meetupId: number,
  ): Promise<number[]> {
    return await this.meetupUsersService.loadMeetupFlaggingUserIds(meetupId);
  }
}
