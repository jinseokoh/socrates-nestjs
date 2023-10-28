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
import { JoinStatus, JoinType } from 'src/common/enums';
import { Join } from 'src/domain/meetups/entities/join.entity';
import { SkipThrottle } from '@nestjs/throttler';
import { CreateJoinDto } from 'src/domain/users/dto/create-join.dto';
import { AcceptOrDenyDto } from 'src/domain/users/dto/accept-or-deny.dto';

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
  @Post(':userId/meetups-liked/:meetupId')
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
  @Delete(':userId/meetups-liked/:meetupId')
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
  @Get(':userId/meetups-liked')
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
  @Get(':userId/meetupids-liked')
  async getMeetupIdsLikedByMe(
    @Param('userId') userId: number,
  ): Promise<AnyData> {
    return this.usersService.getMeetupIdsLikedByMe(userId);
  }

  //?-------------------------------------------------------------------------//
  //? Dislike Pivot
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '나의 블락 리스트에 추가' })
  @Post(':userId/meetups-disliked/:meetupId')
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
  @Delete(':userId/meetups-disliked/:meetupId')
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
  @Get(':userId/meetups-disliked')
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
  @Get(':userId/meetupids-disliked')
  async getMeetupIdsDislikedByMe(
    @Param('userId') userId: number,
  ): Promise<AnyData> {
    return this.usersService.getMeetupIdsDislikedByMe(userId);
  }

  //?-------------------------------------------------------------------------//
  //? Join Pivot
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '참가신청 리스트에 추가' })
  @PaginateQueryOptions()
  @Post(':askingUserId/joins/:askedUserId/meetups/:meetupId')
  async attachToJoinPivot(
    @Param('askingUserId', ParseIntPipe) askingUserId: number,
    @Param('askedUserId', ParseIntPipe) askedUserId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Body() dto: CreateJoinDto, // optional message, and skill
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

  @ApiOperation({ description: '매치신청 승인/거부' })
  @PaginateQueryOptions()
  @Patch(':askingUserId/joins/:askedUserId/meetups/:meetupId')
  async updateJoinToAcceptOrDeny(
    @Param('askingUserId', ParseIntPipe) askingUserId: number,
    @Param('askedUserId', ParseIntPipe) askedUserId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Body() dto: AcceptOrDenyDto,
  ): Promise<AnyData> {
    try {
      await this.usersService.updateJoinToAcceptOrDeny(
        askingUserId,
        askedUserId,
        meetupId,
        JoinStatus[dto.status],
        JoinType[dto.joinType],
      );
      return {
        data: 'ok',
      };
    } catch (e) {
      throw new BadRequestException();
    }
  }

  @ApiOperation({ description: '신청한 모임 리스트' })
  @PaginateQueryOptions()
  @Get(':userId/meetups-requested')
  async getMeetupsRequested(
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Meetup>> {
    const { data, meta, links } = await this.usersService.getMeetupsRequested(
      userId,
      query,
    );

    return {
      data: data.map((v) => v.meetup),
      meta: meta,
      links: links,
    } as Paginated<Meetup>;
  }

  @ApiOperation({ description: '신청한 모임ID 리스트' })
  @Get(':userId/meetupids-requested')
  async getMeetupIdsToJoin(@Param('userId') userId: number): Promise<AnyData> {
    return this.usersService.getMeetupIdsRequested(userId);
  }

  @ApiOperation({ description: '초대받은 모임 리스트' })
  @PaginateQueryOptions()
  @Get(':userId/meetups-invited')
  async getMeetupsAskingMeToJoin(
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Meetup>> {
    const { data, meta, links } = await this.usersService.getMeetupsInvited(
      userId,
      query,
    );

    return {
      data: data.map((v) => v.meetup),
      meta: meta,
      links: links,
    } as Paginated<Meetup>;
  }

  @ApiOperation({ description: '초대받은 모임ID 리스트' })
  @Get(':userId/meetupids-invited')
  async getMeetupIdsInvited(@Param('userId') userId: number): Promise<AnyData> {
    return this.usersService.getMeetupIdsInvited(userId);
  }

  @ApiOperation({ description: '내가 신청한 사용자 리스트' })
  @PaginateQueryOptions()
  @Get(':userId/users-requested')
  async getUsersRequested(
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Join>> {
    return await this.usersService.getUsersRequested(userId, query);
  }

  @ApiOperation({ description: '나를 초대한 사용자 리스트' })
  @PaginateQueryOptions()
  @Get(':userId/users-invited')
  async getUsersInvited(
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Join>> {
    return await this.usersService.getUsersInvited(userId, query);
  }
}
