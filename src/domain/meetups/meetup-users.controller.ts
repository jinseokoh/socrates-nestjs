import {
  BadRequestException,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { NumberData } from 'src/common/types';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { MeetupsService } from 'src/domain/meetups/meetups.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('meetups')
export class MeetupUsersController {
  constructor(private readonly meetupsService: MeetupsService) {}

  //?-------------------------------------------------------------------------//
  //? 찜 리스트
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Meetup faves' })
  @Get(':id/faves')
  async getFavers(@Param('id') id: string): Promise<Meetup> {
    return await this.meetupsService.getFavers(id);
  }

  //?-------------------------------------------------------------------------//
  //? 찜 확인
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '옥션 관심사용자 등록확인' })
  @Get(':meetupId/users/:userId/check')
  async checkFaver(
    @Param('meetupId') meetupId: string,
    @Param('userId') userId: number,
  ): Promise<any> {
    const val = await this.meetupsService.checkFaver(meetupId, userId);
    return { data: val };
  }

  //?-------------------------------------------------------------------------//
  //? 찜 추가
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '옥션 관심사용자 추가' })
  @Put(':meetupId/users/:userId')
  async attachFaver(
    @CurrentUserId() id: number,
    @Param('meetupId') meetupId: string,
    @Param('userId') userId: number,
  ): Promise<NumberData> {
    if (id !== userId) {
      throw new BadRequestException(`doh! mind your id`);
    }
    const { affectedRows } = await this.meetupsService.attachFaver(
      meetupId,
      userId,
    );
    return { data: affectedRows };
  }

  //?-------------------------------------------------------------------------//
  //? 찜 삭제
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '옥션 관심사용자 삭제' })
  @Delete(':meetupId/users/:userId')
  async detachFaver(
    @CurrentUserId() id: number,
    @Param('meetupId') meetupId: string,
    @Param('userId') userId: number,
  ): Promise<NumberData> {
    if (id !== userId) {
      throw new BadRequestException(`doh! mind your id`);
    }
    const { affectedRows } = await this.meetupsService.detachFaver(
      meetupId,
      userId,
    );
    return { data: affectedRows };
  }
}
