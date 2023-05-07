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

@UseInterceptors(ClassSerializerInterceptor)
@Controller('meetups')
export class MatchsController {
  constructor(private readonly meetupsService: MeetupsService) {}

  //?-------------------------------------------------------------------------//
  //? 찜 리스트
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '이 모임을 찜한 모든 사용자 리스트' })
  @Get(':id/users')
  async getLikedUsers(@Param('id', ParseIntPipe) id: number): Promise<AnyData> {
    const users = await this.meetupsService.getAllUsersLiked(id);

    return {
      data: users,
    };
  }
}
