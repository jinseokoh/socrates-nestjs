import {
  Body,
  ClassSerializerInterceptor,
  Controller,
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
import { Join } from 'src/domain/meetups/entities/join.entity';
import { SkipThrottle } from '@nestjs/throttler';
import { CreateJoinDto } from 'src/domain/users/dto/create-join.dto';
import { AcceptOrDenyDto } from 'src/domain/users/dto/accept-or-deny.dto';
import { UsersService } from 'src/domain/users/users.service';
import { UserJoinsService } from 'src/domain/users/user-joins.service';

@UseInterceptors(ClassSerializerInterceptor)
@SkipThrottle()
@Controller('users')
export class UserJoinsController {
  constructor(
    private readonly userJoinsService: UserJoinsService,
    private readonly usersService: UsersService,
  ) {}

  @ApiOperation({ description: '모임신청 리스트에 추가' })
  @PaginateQueryOptions()
  @Post(':userId/joins/:recipientId/meetups/:meetupId')
  async attachToJoinPivot(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('recipientId', ParseIntPipe) recipientId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Body() dto: CreateJoinDto, // optional message, and skill
  ): Promise<AnyData> {
    // 모임신청 생성
    const meetup = await this.userJoinsService.attachToJoinPivot(
      userId,
      recipientId,
      meetupId,
      dto,
    );
    // user's interests 추가
    await this.usersService.upsertCategoryWithSkill(
      userId,
      meetup.subCategory,
      dto.skill,
    );
    return {
      data: 'ok',
    };
  }

  @ApiOperation({ description: '모임신청 수락/거부' })
  @PaginateQueryOptions()
  @Patch(':userId/joins/:recipientId/meetups/:meetupId')
  async updateJoinToAcceptOrDeny(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('recipientId', ParseIntPipe) recipientId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Body() dto: AcceptOrDenyDto,
  ): Promise<AnyData> {
    await this.userJoinsService.updateJoinToAcceptOrDeny(
      userId,
      recipientId,
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
    return await this.userJoinsService.getMeetupsRequested(userId, query);
  }

  @ApiOperation({ description: '내가 신청한 모임ID 리스트 (all)' })
  @Get(':userId/meetupids-requested')
  async getMeetupIdsToJoin(@Param('userId') userId: number): Promise<AnyData> {
    const data = await this.userJoinsService.getMeetupIdsRequested(userId);
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
    const { data, meta, links } = await this.userJoinsService.getMeetupsInvited(
      userId,
      query,
    );

    return {
      data: data,
      meta: meta,
      links: links,
    }; // as Paginated<Join>;
  }

  @ApiOperation({ description: '나를 초대한 모임ID 리스트 (all)' })
  @Get(':userId/meetupids-invited')
  async getMeetupIdsInvited(@Param('userId') userId: number): Promise<AnyData> {
    return await this.userJoinsService.getMeetupIdsInvited(userId);
  }
}
