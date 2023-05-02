import { User } from 'src/domain/users/entities/user.entity';
import {
  BadRequestException,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { AnyData } from 'src/common/types';
import { UsersService } from 'src/domain/users/users.service';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { Match } from 'src/domain/meetups/entities/match.entity';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UserMeetupsController {
  constructor(private readonly usersService: UsersService) {}

  //?-------------------------------------------------------------------------//
  //? MeetupUser Pivot
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '나의 찜 리스트에 추가' })
  @PaginateQueryOptions()
  @Post(':userId/meetups/:meetupId')
  async attachToMeetupUserPivot(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('meetupId', ParseUUIDPipe) meetupId: string,
  ): Promise<any> {
    return this.usersService.attachToMeetupUserPivot(userId, meetupId);
  }

  @ApiOperation({ description: '나의 찜 리스트에서 삭제' })
  @PaginateQueryOptions()
  @Delete(':userId/meetups/:meetupId')
  async detachFromMeetupUserPivot(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('meetupId', ParseUUIDPipe) meetupId: string,
  ): Promise<any> {
    return this.usersService.detachFromMeetupUserPivot(userId, meetupId);
  }

  //?-------------------------------------------------------------------------//
  //? Match Pivot
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '내가 매치신청 리스트에 추가' })
  @PaginateQueryOptions()
  @Post(':askingId/matches/:askedId/meetups/:meetupId')
  async attachToMatchPivot(
    @Param('askingId') askingId: number,
    @Param('askedId') askedId: number,
    @Param('meetupId') meetupId: string,
  ): Promise<any> {
    return this.usersService.attachToMatchPivot(askingId, askedId, meetupId);
  }

  @ApiOperation({ description: '나의 찜 리스트에서 삭제' })
  @PaginateQueryOptions()
  @Delete(':askingId/matches/:askedId/meetups/:meetupId')
  async detachFromMatchPivot(
    @Param('askingId') askingId: number,
    @Param('askedId') askedId: number,
    @Param('meetupId') meetupId: string,
  ): Promise<any> {
    return this.usersService.detachFromMatchPivot(askingId, askedId, meetupId);
  }

  @PaginateQueryOptions()
  @Get(':userId/faves')
  async getFavMeetupsById(
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Match>> {
    return this.usersService.getUserFavMeetups(userId, query);
  }

  @ApiOperation({ description: '내가 찜한 meetup 아이디 리스트' })
  @PaginateQueryOptions()
  @Get(':id/faveids')
  async getFavMeetupIdsById(@Param('id') id: number): Promise<AnyData> {
    return this.usersService.getFavMeetupIdsById(id);
  }
}
