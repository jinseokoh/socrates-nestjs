import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { AnyData } from 'src/common/types';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { Join } from 'src/domain/meetups/entities/join.entity';
import { SkipThrottle } from '@nestjs/throttler';
import { CreateJoinDto } from 'src/domain/users/dto/create-join.dto';
import { AcceptOrDenyDto } from 'src/domain/users/dto/accept-or-deny.dto';
import { UserMeetupsService } from 'src/domain/users/user-meetups.service';
import { UsersService } from 'src/domain/users/users.service';
import { FlagsService } from 'src/domain/users/flags.service';
import { BookmarkUserMeetupService } from 'src/domain/users/bookmark_user_meetup.service';
import { BookmarkUserMeetup } from 'src/domain/users/entities/bookmark_user_meetup.entity';
import { User } from 'src/domain/users/entities/user.entity';

@UseInterceptors(ClassSerializerInterceptor)
@SkipThrottle()
@Controller('users')
export class UserMeetupsController {
  constructor(
    private readonly userMeetupsService: UserMeetupsService,
    private readonly flagsService: FlagsService,
    private readonly bookmarksService: BookmarkUserMeetupService,
    private readonly usersService: UsersService,
  ) {}

  //?-------------------------------------------------------------------------//
  //? 내가 만든 Meetups
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '내가 만든 Meetups (paginated)' })
  @PaginateQueryOptions()
  @Get(':userId/meetups')
  async findMyMeetups(
    @Param('userId', ParseIntPipe) userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Meetup>> {
    return await this.userMeetupsService.getMyMeetups(userId, query);
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

  //?-------------------------------------------------------------------------//
  //? 내가 북마크/찜(BookmarkUserMeetup)한 Meetups
  //?-------------------------------------------------------------------------//

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

  //?-------------------------------------------------------------------------//
  //? 내가 신고한 Meetups
  //?-------------------------------------------------------------------------//

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

  //! -------------------------------------------------------------------------//
  //! todo. Join Pivot
  //! -------------------------------------------------------------------------//

  @ApiOperation({ description: '모임신청 리스트에 추가' })
  @PaginateQueryOptions()
  @Post(':askingUserId/joins/:askedUserId/meetups/:meetupId')
  async attachToJoinPivot(
    @Param('askingUserId', ParseIntPipe) askingUserId: number,
    @Param('askedUserId', ParseIntPipe) askedUserId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Body() dto: CreateJoinDto, // optional message, and skill
  ): Promise<AnyData> {
    // 모임신청 생성
    const meetup = await this.userMeetupsService.attachToJoinPivot(
      askingUserId,
      askedUserId,
      meetupId,
      dto,
    );
    // user's interests 추가
    await this.usersService.upsertCategoryWithSkill(
      askingUserId,
      meetup.subCategory,
      dto.skill,
    );
    return {
      data: 'ok',
    };
  }

  @ApiOperation({ description: '모임신청 수락/거부' })
  @PaginateQueryOptions()
  @Patch(':askingUserId/joins/:askedUserId/meetups/:meetupId')
  async updateJoinToAcceptOrDeny(
    @Param('askingUserId', ParseIntPipe) askingUserId: number,
    @Param('askedUserId', ParseIntPipe) askedUserId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Body() dto: AcceptOrDenyDto,
  ): Promise<AnyData> {
    await this.userMeetupsService.updateJoinToAcceptOrDeny(
      askingUserId,
      askedUserId,
      meetupId,
      dto.status,
      dto.joinType,
    );
    return {
      data: 'ok',
    };
  }

  @ApiOperation({ description: '내가 신청(request)한 모임 리스트 (paginated)' })
  @PaginateQueryOptions()
  @Get(':userId/meetups-requested')
  async getMeetupsRequested(
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Join>> {
    return await this.userMeetupsService.getMeetupsRequested(userId, query);
  }

  @ApiOperation({ description: '내가 신청한 모임ID 리스트 (all)' })
  @Get(':userId/meetupids-requested')
  async getMeetupIdsToJoin(@Param('userId') userId: number): Promise<AnyData> {
    const data = await this.userMeetupsService.getMeetupIdsRequested(userId);
    return { data };
  }

  @ApiOperation({
    description: '내가 초대(invitation)받은 모임 리스트 (paginated)',
  })
  @PaginateQueryOptions()
  @Get(':userId/meetups-invited')
  async getMeetupsInvited(
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Join>> {
    const { data, meta, links } =
      await this.userMeetupsService.getMeetupsInvited(userId, query);

    return {
      data: data,
      meta: meta,
      links: links,
    }; // as Paginated<Join>;
  }

  @ApiOperation({ description: '나를 초대한 모임ID 리스트 (all)' })
  @Get(':userId/meetupids-invited')
  async getMeetupIdsInvited(@Param('userId') userId: number): Promise<AnyData> {
    return await this.userMeetupsService.getMeetupIdsInvited(userId);
  }
}
