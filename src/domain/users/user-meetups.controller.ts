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
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { Join } from 'src/domain/meetups/entities/join.entity';
import { SkipThrottle } from '@nestjs/throttler';
import { CreateJoinDto } from 'src/domain/users/dto/create-join.dto';
import { AcceptOrDenyDto } from 'src/domain/users/dto/accept-or-deny.dto';
import { UsersMeetupService } from 'src/domain/users/users-meetup.service';
import { UsersService } from 'src/domain/users/users.service';

// todo. move all the try catch from controller layer to service layer
@UseInterceptors(ClassSerializerInterceptor)
@SkipThrottle()
@Controller('users')
export class UserMeetupsController {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersMeetupService: UsersMeetupService,
) {}

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
    return await this.usersMeetupService.getMyMeetups(userId, query);
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
      await this.usersMeetupService.attachToLikePivot(userId, meetupId);
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
      await this.usersMeetupService.detachFromLikePivot(userId, meetupId);
      return {
        data: 'ok',
      };
    } catch (e) {
      throw new BadRequestException();
    }
  }

  @ApiOperation({ description: '내가 찜한 모임 리스트 (paginated)' })
  @PaginateQueryOptions()
  @Get(':userId/meetups-liked')
  async getMeetupsLikedByMe(
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Meetup>> {
    const { data, meta, links } =
      await this.usersMeetupService.getMeetupsLikedByMe(userId, query);

    return {
      data: data.map((v) => v.meetup),
      meta: meta,
      links: links,
    } as Paginated<Meetup>;
  }

  @ApiOperation({ description: '내가 찜한 모임ID 리스트 (all; 최대30)' })
  @PaginateQueryOptions()
  @Get(':userId/meetupids-liked')
  async getMeetupIdsLikedByMe(
    @Param('userId') userId: number,
  ): Promise<AnyData> {
    const data: number[] = await this.usersMeetupService.getMeetupIdsLikedByMe(
      userId,
    );
    return { data };
  }

  //?-------------------------------------------------------------------------//
  //? ReportMeetup Pivot
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '차단한 모임 리스트에 추가' })
  @Post(':userId/meetups-reported/:meetupId')
  async attachToMeetupReportPivot(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Body('message') message: string,
  ): Promise<any> {
    //? checking if this meetup belongs to the user costs a database access,
    //? which you can get around if you design your application carefully.
    //? so user validation has been removed. keep that in mind.
    try {
      await this.usersMeetupService.attachToReportMeetupPivot(
        userId,
        meetupId,
        message,
      );

      return {
        data: 'ok',
      };
    } catch (e) {
      throw new BadRequestException();
    }
  }

  @ApiOperation({ description: '차단한 모임 리스트에서 삭제' })
  @Delete(':userId/meetups-reported/:meetupId')
  async detachFromReportMeetupPivot(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
  ): Promise<any> {
    //? checking if this meetup belongs to the user costs a database access,
    //? which you can get around if you design your application carefully.
    //? so user validation has been removed. keep that in mind.
    try {
      await this.usersMeetupService.detachFromReportMeetupPivot(
        userId,
        meetupId,
      );
      return {
        data: 'ok',
      };
    } catch (e) {
      throw new BadRequestException();
    }
  }

  @ApiOperation({ description: '내가 차단한 모임 리스트 (paginated)' })
  @PaginateQueryOptions()
  @Get(':userId/meetups-reported')
  async getMeetupsReportedByMe(
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Meetup>> {
    const { data, meta, links } =
      await this.usersMeetupService.getMeetupsReportedByMe(userId, query);

    return {
      data: data.map((v) => v.meetup),
      meta: meta,
      links: links,
    } as Paginated<Meetup>;
  }

  @ApiOperation({ description: '내가 차단한 모임ID 리스트 (all)' })
  @PaginateQueryOptions()
  @Get(':userId/meetupids-reported')
  async getMeetupIdsReportdByMe(
    @Param('userId') userId: number,
  ): Promise<AnyData> {
    return await this.usersMeetupService.getMeetupIdsReportedByMe(userId);
  }

  //?-------------------------------------------------------------------------//
  //? Join Pivot
  //?-------------------------------------------------------------------------//

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
    const meetup = await this.usersMeetupService.attachToJoinPivot(
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
    try {
      await this.usersMeetupService.updateJoinToAcceptOrDeny(
        askingUserId,
        askedUserId,
        meetupId,
        dto.status,
        dto.joinType,
      );
      return {
        data: 'ok',
      };
    } catch (e) {
      throw new BadRequestException();
    }
  }

  @ApiOperation({ description: '내가 신청(request)한 모임 리스트 (paginated)' })
  @PaginateQueryOptions()
  @Get(':userId/meetups-requested')
  async getMeetupsRequested(
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Join>> {
    return await this.usersMeetupService.getMeetupsRequested(userId, query);
  }

  @ApiOperation({ description: '내가 신청한 모임ID 리스트 (all)' })
  @Get(':userId/meetupids-requested')
  async getMeetupIdsToJoin(@Param('userId') userId: number): Promise<AnyData> {
    const data = await this.usersMeetupService.getMeetupIdsRequested(userId);
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
      await this.usersMeetupService.getMeetupsInvited(userId, query);

    return {
      data: data,
      meta: meta,
      links: links,
    }; // as Paginated<Join>;
  }

  @ApiOperation({ description: '나를 초대한 모임ID 리스트 (all)' })
  @Get(':userId/meetupids-invited')
  async getMeetupIdsInvited(@Param('userId') userId: number): Promise<AnyData> {
    return await this.usersMeetupService.getMeetupIdsInvited(userId);
  }
}
