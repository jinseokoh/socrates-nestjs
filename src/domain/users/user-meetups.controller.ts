import { User } from 'src/domain/users/entities/user.entity';
import {
  BadRequestException,
  ClassSerializerInterceptor,
  Controller,
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

  @ApiOperation({ description: '내가 찜한 meetup 리스트' })
  @PaginateQueryOptions()
  @Get(':userId/meetups')
  async getMeetupsByUserId(
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Meetup>> {
    return this.usersService.getUserMeetups(userId, query);
  }

  @ApiOperation({ description: '내가 찜한 meetup 리스트' })
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

  //?-------------------------------------------------------------------------//
  //? 바로신청 추가
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '신청 추가' })
  @Post(':userId/meetups/:meetupId')
  async attachMatcher(
    @CurrentUserId() id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Param('meetupId', ParseUUIDPipe) meetupId: string,
  ): Promise<AnyData> {
    if (id !== userId) {
      throw new BadRequestException(`doh! mind your id`);
    }
    await this.usersService.attachMatcher(userId, meetupId);
    return { data: 'ok' };
  }

  @ApiOperation({ description: '신청 추가' })
  @Post(':userId/meetups/:meetupId')
  async attachFaver(
    @CurrentUserId() id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Param('meetupId', ParseUUIDPipe) meetupId: string,
  ): Promise<AnyData> {
    if (id !== userId) {
      throw new BadRequestException(`doh! mind your id`);
    }
    await this.usersService.attachFaver(userId, meetupId);
    return { data: 'ok' };
  }

  @ApiOperation({ description: '신청 추가' })
  @Post(':userId/meetups/:meetupId')
  async detachFaver(
    @CurrentUserId() id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Param('meetupId', ParseUUIDPipe) meetupId: string,
  ): Promise<AnyData> {
    if (id !== userId) {
      throw new BadRequestException(`doh! mind your id`);
    }
    await this.usersService.detachFaver(userId, meetupId);
    return { data: 'ok' };
  }
}

