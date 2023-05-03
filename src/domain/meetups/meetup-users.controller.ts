import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { AnyData } from 'src/common/types';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
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
  async getLikedUsers(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AnyData> {
    const users = await this.meetupsService.getLikedUsers(id);

    return {
      data: users,
    };
  }
}
