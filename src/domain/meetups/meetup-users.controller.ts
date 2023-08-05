import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { AnyData } from 'src/common/types';
import { Join } from 'src/domain/meetups/entities/join.entity';
import { MeetupsService } from 'src/domain/meetups/meetups.service';
import { User } from 'src/domain/users/entities/user.entity';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('meetups')
export class MeetupUsersController {
  constructor(private readonly meetupsService: MeetupsService) {}

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
