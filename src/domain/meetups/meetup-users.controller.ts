import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { AnyData } from 'src/common/types';
import { MeetupsService } from 'src/domain/meetups/meetups.service';
import { User } from 'src/domain/users/entities/user.entity';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('meetups')
export class MeetupUsersController {
  constructor(private readonly meetupsService: MeetupsService) {}

  //?-------------------------------------------------------------------------//
  //? 참가신청 리스트
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '이 모임에 신청한 사용자 리스트 (최대30명)' })
  @Get(':id/joiners')
  async getAllJoiners(@Param('id', ParseIntPipe) id: number): Promise<AnyData> {
    const users = await this.meetupsService.getAllJoiners(id);
    return {
      data: users,
    };
  }

  @ApiOperation({ description: '이 모임에 초대한 사용자 리스트 (최대30명)' })
  @Get(':id/invitees')
  async getAllInvitees(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AnyData> {
    const users = await this.meetupsService.getAllInvitees(id);
    return {
      data: users,
    };
  }

  //?-------------------------------------------------------------------------//
  //? 찜 리스트
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '이 모임을 찜한 모든 likers' })
  @Get(':id/likers')
  async getAllLikers(@Param('id', ParseIntPipe) id: number): Promise<AnyData> {
    const likers = await this.meetupsService.getAllLikers(id);
    return {
      data: likers,
    };
  }

  @ApiOperation({ description: '이 모임을 찜한 사용자ID 리스트' })
  @Get(':id/like_ids')
  async getAllLikeIds(@Param('id', ParseIntPipe) id: number): Promise<AnyData> {
    const ids = await this.meetupsService.getAllLikeIds(id);
    return {
      data: ids,
    };
  }

  //?-------------------------------------------------------------------------//
  //? 블락 리스트
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '이 모임을 신고한 사용자 리스트' })
  @Get(':id/reporters')
  async getMeetupReporters(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AnyData> {
    const reporters = await this.meetupsService.getMeetupReporters(id);
    return {
      data: reporters,
    };
  }

  @ApiOperation({ description: '이 모임을 신고한 사용자ID 리스트' })
  @Get(':id/reporter_ids')
  async getMeetupReporterIds(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AnyData> {
    const ids = await this.meetupsService.getMeetupReporterIds(id);
    return {
      data: ids,
    };
  }
}
