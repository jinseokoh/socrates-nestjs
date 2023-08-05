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

  @ApiOperation({ description: '이 모임 참가신청한 모든 likers' })
  @Get(':id/joins')
  async getAllJoiners(@Param('id', ParseIntPipe) id: number): Promise<AnyData> {
    const joins = await this.meetupsService.getAllJoins(id);
    return {
      data: joins,
    };
  }

  @ApiOperation({ description: '이 모임 참가신청한 사용자ID 리스트' })
  @Get(':id/join_ids')
  async getAllJoinerIds(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AnyData> {
    const ids = await this.meetupsService.getAllJoinerIds(id);
    return {
      data: ids,
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

  @ApiOperation({ description: '이 모임을 신고한 사용자ID 리스트' })
  @Get(':id/dislikers')
  async getAllDislikers(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AnyData> {
    const dislikers = await this.meetupsService.getAllDislikers(id);
    return {
      data: dislikers,
    };
  }

  @ApiOperation({ description: '이 모임을 신고한 사용자ID 리스트' })
  @Get(':id/dislike_ids')
  async getAllDislikeIds(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AnyData> {
    const ids = await this.meetupsService.getAllDislikeIds(id);
    return {
      data: ids,
    };
  }
}
