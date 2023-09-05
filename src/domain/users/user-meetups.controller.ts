import {
  BadRequestException,
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
import { UsersService } from 'src/domain/users/users.service';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { Status } from 'src/common/enums/status';
import { Join } from 'src/domain/meetups/entities/join.entity';
import { SkipThrottle } from '@nestjs/throttler';
import { CreateJoinDto } from 'src/domain/users/dto/create-join.dto';

@UseInterceptors(ClassSerializerInterceptor)
@SkipThrottle()
@Controller('users')
export class UserMeetupsController {
  constructor(private readonly usersService: UsersService) {}

  //?-------------------------------------------------------------------------//
  //? 내가 만든 모임 리스트
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '내가 만든 모임 리스트' })
  @PaginateQueryOptions()
  @Get(':userId/meetups')
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

    console.log(userId, meetupId);
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
  //? Dislike Pivot
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '나의 블락 리스트에 추가' })
  @Post(':userId/dislikemeetups/:meetupId')
  async attachToDislikePivot(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Body('message') message: string,
  ): Promise<any> {
    //? checking if this meetup belongs to the user costs a database access,
    //? which you can get around if you design your application carefully.
    //? so user validation has been removed. keep that in mind.
    try {
      await this.usersService.attachToDislikePivot(userId, meetupId, message);

      return {
        data: 'ok',
      };
    } catch (e) {
      throw new BadRequestException();
    }
  }

  @ApiOperation({ description: '나의 블락 리스트에서 삭제' })
  @Delete(':userId/dislikemeetups/:meetupId')
  async detachFromDislikePivot(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
  ): Promise<any> {
    //? checking if this meetup belongs to the user costs a database access,
    //? which you can get around if you design your application carefully.
    //? so user validation has been removed. keep that in mind.
    try {
      await this.usersService.detachFromDislikePivot(userId, meetupId);
      return {
        data: 'ok',
      };
    } catch (e) {
      throw new BadRequestException();
    }
  }

  @ApiOperation({ description: '내가 블락한 모임 리스트' })
  @PaginateQueryOptions()
  @Get(':userId/dislikemeetups')
  async getMeetupsDislikedByMe(
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Meetup>> {
    const { data, meta, links } =
      await this.usersService.getMeetupsDislikedByMe(userId, query);

    return {
      data: data.map((v) => v.meetup),
      meta: meta,
      links: links,
    } as Paginated<Meetup>;
  }

  @ApiOperation({ description: '내가 블락한 모임ID 리스트' })
  @PaginateQueryOptions()
  @Get(':userId/dislikemeetupids')
  async getMeetupIdsDislikedByMe(
    @Param('userId') userId: number,
  ): Promise<AnyData> {
    return this.usersService.getMeetupIdsDislikedByMe(userId);
  }

  //?-------------------------------------------------------------------------//
  //? Join Pivot
  //?-------------------------------------------------------------------------//

  // todo. validate this meetup belongs to me
  @ApiOperation({ description: '나를 참가신청 리스트에 추가' })
  @PaginateQueryOptions()
  @Post(':askingUserId/joins/:askedUserId/meetups/:meetupId')
  async attachToJoinPivot(
    @Param('askingUserId', ParseIntPipe) askingUserId: number,
    @Param('askedUserId', ParseIntPipe) askedUserId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Body() dto: CreateJoinDto,
  ): Promise<AnyData> {
    const meetup = await this.usersService.attachToJoinPivot(
      askingUserId,
      askedUserId,
      meetupId,
      dto,
    );
    await this.usersService.upsertCategoryWithSkill(
      askingUserId,
      meetup.subCategory,
      dto.skill,
    );
    return {
      data: 'ok',
    };
  }

  // todo. validate asking/asked combo is the other way around
  @ApiOperation({ description: '매치신청 승인/거부' })
  @PaginateQueryOptions()
  @Patch(':askingUserId/joins/:askedUserId/meetups/:meetupId')
  async updateJoinToAcceptOrDeny(
    @Param('askingUserId', ParseIntPipe) askingUserId: number,
    @Param('askedUserId', ParseIntPipe) askedUserId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Body('status') status: Status,
  ): Promise<AnyData> {
    try {
      await this.usersService.updateJoinToAcceptOrDeny(
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

  @ApiOperation({ description: '내가 신청한 모임 리스트' })
  @PaginateQueryOptions()
  @Get(':userId/prejoin-meetups')
  async getMeetupsAskedByMe(
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Meetup>> {
    const { data, meta, links } = await this.usersService.getMeetupsAskedByMe(
      userId,
      query,
    );

    return {
      data: data.map((v) => v.meetup),
      meta: meta,
      links: links,
    } as Paginated<Meetup>;
  }

  @ApiOperation({ description: '내가 신청한 모임ID 리스트' })
  @Get(':userId/prejoin-meetupids')
  async getMeetupIdsAskedByMe(
    @Param('userId') userId: number,
  ): Promise<AnyData> {
    return this.usersService.getMeetupIdsAskedByMe(userId);
  }

  @ApiOperation({ description: '내에게 만나자고 신청한 호구 리스트' })
  @PaginateQueryOptions()
  @Get(':userId/users-asking-me-to-join')
  async getUsersAskingMe(
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Join>> {
    return await this.usersService.getUsersAskingMe(userId, query);
  }

  @ApiOperation({ description: '내가 만나자고 신청드린 상대방 리스트' })
  @PaginateQueryOptions()
  @Get(':userId/users-i-asked-to-join')
  async getUsersAskedByMe(
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Join>> {
    return await this.usersService.getUsersAskedByMe(userId, query);
  }
}
