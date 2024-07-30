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
import { UserJoinsService } from 'src/domain/users/user-joins.service';
import { UserCategoriesService } from 'src/domain/users/user-categories.service';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';

@UseInterceptors(ClassSerializerInterceptor)
@SkipThrottle()
@Controller('users')
export class UserJoinsController {
  constructor(
    private readonly userJoinsService: UserJoinsService,
    private readonly userCategoriesService: UserCategoriesService,
  ) {}

  @ApiOperation({ description: '모임신청 생성' })
  @PaginateQueryOptions()
  @Post(':userId/joins/:recipientId/meetups/:meetupId')
  async createJoin(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('recipientId', ParseIntPipe) recipientId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Body() dto: CreateJoinDto, // optional message, and skill
  ): Promise<void> {
    // 모임신청 생성
    const meetup = await this.userJoinsService.createJoin(
      userId,
      recipientId,
      meetupId,
      dto,
    );
    // user's interests 추가
    await this.userCategoriesService.upsertCategoryWithSkill(
      userId,
      meetup.subCategory,
      dto.skill,
    );
  }

  @ApiOperation({ description: '모임신청 수락/거부' })
  @PaginateQueryOptions()
  @Patch(':userId/joins/:recipientId/meetups/:meetupId')
  async updateJoinToAcceptOrDeny(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('recipientId', ParseIntPipe) recipientId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Body() dto: AcceptOrDenyDto,
  ): Promise<void> {
    await this.userJoinsService.updateJoinToAcceptOrDeny(
      userId,
      recipientId,
      meetupId,
      dto.status,
      dto.joinType,
    );
  }

  @ApiOperation({ description: '내가 신청(request)한 모임 리스트 (paginated)' })
  @PaginateQueryOptions()
  @Get(':userId/requestedmeetups')
  async listMeetupsRequested(
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Meetup>> {
    return await this.userJoinsService.listMeetupsRequested(userId, query);
  }

  @ApiOperation({ description: '내가 신청한 모임ID 리스트 (all)' })
  @Get(':userId/requestedmeetupids')
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
