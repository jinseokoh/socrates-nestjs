import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { AnyData } from 'src/common/types';
import { UsersService } from 'src/domain/users/users.service';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { Status } from 'src/common/enums/status';
import { Match } from 'src/domain/meetups/entities/match.entity';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UserMeetupsController {
  constructor(private readonly usersService: UsersService) {}

  //?-------------------------------------------------------------------------//
  //? 내가 만든 모임 리스트
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '내가 만든 모임 리스트' })
  @PaginateQueryOptions()
  @Get(':userId/likemeetups')
  async getMyMeetups(
    @Param('userId', ParseIntPipe) userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Meetup>> {
    return await this.usersService.getMyMeetups(userId, query);
  }

  //?-------------------------------------------------------------------------//
  //? Like Pivot
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '나의 찜 리스트에 추가' })
  @Post(':userId/likemeetups/:meetupId')
  async attachToLikePivot(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
  ): Promise<any> {
    //? checking if this meetup belongs to the user costs a database access,
    //? which you can get around if you design your application carefully.
    //? so user validation has been removed. keep that in mind.
    try {
      await this.usersService.attachToLikePivot(userId, meetupId);
      return {
        data: 'ok',
      };
    } catch (e) {
      throw new BadRequestException();
    }
  }

  @ApiOperation({ description: '나의 찜 리스트에서 삭제' })
  @Delete(':userId/likemeetups/:meetupId')
  async detachFromLikePivot(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
  ): Promise<any> {
    //? checking if this meetup belongs to the user costs a database access,
    //? which you can get around if you design your application carefully.
    //? so user validation has been removed. keep that in mind.
    try {
      await this.usersService.detachFromLikePivot(userId, meetupId);
      return {
        data: 'ok',
      };
    } catch (e) {
      throw new BadRequestException();
    }
  }

  @ApiOperation({ description: '내가 찜한 모임 리스트' })
  @PaginateQueryOptions()
  @Get(':userId/likemeetups')
  async getMeetupsLikedByMe(
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Meetup>> {
    const { data, meta, links } = await this.usersService.getMeetupsLikedByMe(
      userId,
      query,
    );

    return {
      data: data.map((v) => v.meetup),
      meta: meta,
      links: links,
    } as Paginated<Meetup>;
  }

  @ApiOperation({ description: '내가 찜한 모임ID 리스트' })
  @PaginateQueryOptions()
  @Get(':userId/likemeetupids')
  async getMeetupIdsLikedByMe(
    @Param('userId') userId: number,
  ): Promise<AnyData> {
    return this.usersService.getMeetupIdsLikedByMe(userId);
  }

  //?-------------------------------------------------------------------------//
  //? Hate Pivot
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '나의 블락 리스트에 추가' })
  @Post(':userId/hatemeetups/:meetupId')
  async attachToHatePivot(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Body('message') message: string,
  ): Promise<any> {
    //? checking if this meetup belongs to the user costs a database access,
    //? which you can get around if you design your application carefully.
    //? so user validation has been removed. keep that in mind.
    try {
      await this.usersService.attachToHatePivot(userId, meetupId, message);

      return {
        data: 'ok',
      };
    } catch (e) {
      throw new BadRequestException();
    }
  }

  @ApiOperation({ description: '나의 블락 리스트에서 삭제' })
  @Delete(':userId/hatemeetups/:meetupId')
  async detachFromHatePivot(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
  ): Promise<any> {
    //? checking if this meetup belongs to the user costs a database access,
    //? which you can get around if you design your application carefully.
    //? so user validation has been removed. keep that in mind.
    try {
      await this.usersService.detachFromHatePivot(userId, meetupId);
      return {
        data: 'ok',
      };
    } catch (e) {
      throw new BadRequestException();
    }
  }

  @ApiOperation({ description: '내가 블락한 모임 리스트' })
  @PaginateQueryOptions()
  @Get(':userId/hatemeetups')
  async getMeetupsHatedByMe(
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Meetup>> {
    const { data, meta, links } = await this.usersService.getMeetupsHatedByMe(
      userId,
      query,
    );

    return {
      data: data.map((v) => v.meetup),
      meta: meta,
      links: links,
    } as Paginated<Meetup>;
  }

  @ApiOperation({ description: '내가 블락한 모임ID 리스트' })
  @PaginateQueryOptions()
  @Get(':userId/hatemeetupids')
  async getMeetupIdsHatedByMe(
    @Param('userId') userId: number,
  ): Promise<AnyData> {
    return this.usersService.getMeetupIdsHatedByMe(userId);
  }

  //?-------------------------------------------------------------------------//
  //? Match Pivot
  //?-------------------------------------------------------------------------//

  // todo. validate this meetup belongs to me
  @ApiOperation({ description: '내가 매치신청 리스트에 추가' })
  @PaginateQueryOptions()
  @Post(':askingUserId/matches/:askedUserId/meetups/:meetupId')
  async attachToMatchPivot(
    @Param('askingUserId') askingUserId: number,
    @Param('askedUserId') askedUserId: number,
    @Param('meetupId') meetupId: number,
  ): Promise<AnyData> {
    try {
      await this.usersService.attachToMatchPivot(
        askingUserId,
        askedUserId,
        meetupId,
      );
      return {
        data: 'ok',
      };
    } catch (e) {
      throw new BadRequestException();
    }
  }

  // todo. validate asking/asked combo is the other way around
  @ApiOperation({ description: '매치신청 승인/거부' })
  @PaginateQueryOptions()
  @Patch(':askingUserId/matches/:askedUserId/meetups/:meetupId')
  async updateMatchToAcceptOrDeny(
    @Param('askingUserId') askingUserId: number,
    @Param('askedUserId') askedUserId: number,
    @Param('meetupId') meetupId: number,
    @Body('status') status: Status,
  ): Promise<AnyData> {
    try {
      await this.usersService.updateMatchToAcceptOrDeny(
        askingUserId,
        askedUserId,
        meetupId,
        status,
      );
      return {
        data: 'ok',
      };
    } catch (e) {
      throw new BadRequestException();
    }
  }

  @ApiOperation({ description: '내에게 만나자고 신청한 호구 리스트' })
  @PaginateQueryOptions()
  @Get(':userId/usersasking')
  async getUsersAskingMe(
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Match>> {
    return await this.usersService.getUsersAskingMe(userId, query);
  }

  @ApiOperation({ description: '내가 만나자고 신청드린 상대방 리스트' })
  @PaginateQueryOptions()
  @Get(':userId/usersasked')
  async getUsersAskedByMe(
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Match>> {
    return await this.usersService.getUsersAskedByMe(userId, query);
  }
}
