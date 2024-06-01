import {
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
import { SkipThrottle } from '@nestjs/throttler';
import { Friendship } from 'src/domain/users/entities/friendship.entity';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { AnyData } from 'src/common/types';
import { AlarmType, FriendshipStatus } from 'src/common/enums';
import { AlarmsService } from 'src/domain/alarms/alarms.service';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { CreateFriendshipDto } from 'src/domain/users/dto/create-friendship.dto';
import { UsersFriendshipService } from 'src/domain/users/users-friendship.service';
import { CreateAlarmDto } from 'src/domain/alarms/dto/create-alarm.dto';

@UseInterceptors(ClassSerializerInterceptor)
@SkipThrottle()
@Controller('users')
export class UserFriendshipController {
  constructor(
    private readonly usersFriendshipService: UsersFriendshipService,
    private readonly alarmsService: AlarmsService,
  ) {}

  //?-------------------------------------------------------------------------//
  //? Friendship Pivot
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '친구신청 생성' })
  @PaginateQueryOptions()
  @Post(':senderId/friendships/:recipientId')
  async createFriendship(
    @Param('senderId', ParseIntPipe) senderId: number,
    @Param('recipientId', ParseIntPipe) recipientId: number,
    @Body() dto: CreateFriendshipDto,
  ): Promise<void> {
    await this.usersFriendshipService.createFriendship({
      ...dto,
      senderId,
      recipientId,
    });
    const alarmDto = new CreateAlarmDto();
    alarmDto.alarmType = AlarmType.FRIENDSHIP;
    alarmDto.userId = recipientId;
    alarmDto.message = `새로운 친구초대를 받았습니다.`;
    alarmDto.data = {
      page: 'activities',
      tab: '7',
    };
    await this.alarmsService.create(alarmDto);
  }

  @ApiOperation({ description: '친구신청 수락' })
  @PaginateQueryOptions()
  @Patch(':senderId/friendships/:recipientId')
  async updateFriendshipWithStatus(
    @Param('senderId', ParseIntPipe) senderId: number,
    @Param('recipientId', ParseIntPipe) recipientId: number,
    @Body('status') status: FriendshipStatus,
  ): Promise<AnyData> {
    await this.usersFriendshipService.updateFriendshipWithStatus(
      senderId,
      recipientId,
      status,
    );
    return {
      data: 'ok',
    };
  }

  @ApiOperation({ description: '친구신청 삭제' })
  @PaginateQueryOptions()
  @Delete(':senderId/friendships/:recipientId')
  async deleteFriendship(
    @Param('senderId', ParseIntPipe) senderId: number,
    @Param('recipientId', ParseIntPipe) recipientId: number,
  ): Promise<AnyData> {
    await this.usersFriendshipService.deleteFriendship(senderId, recipientId);
    return {
      data: 'ok',
    };
  }

  //--------------------------------------------------------------------------//

  @ApiOperation({ description: '받은 친구신청 리스트 (paginated)' })
  @PaginateQueryOptions()
  @Get(':userId/friendships-received')
  async getFriendshipsReceived(
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Friendship>> {
    return await this.usersFriendshipService.getFriendshipsReceived(
      userId,
      query,
    );
  }

  @ApiOperation({ description: '보낸 친구신청 리스트 (paginated)' })
  @PaginateQueryOptions()
  @Get(':userId/friendships-sent')
  async getFriendshipsSent(
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Friendship>> {
    return await this.usersFriendshipService.getFriendshipsSent(userId, query);
  }

  @ApiOperation({
    description:
      '내친구 리스트를 위한, 받거나 보낸 친구신청 리스트 (paginated)',
  })
  @Get(':userId/friendships')
  async getMyFriends(
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Friendship>> {
    return this.usersFriendshipService.getMyFriendships(userId, query);
  }

  //--------------------------------------------------------------------------//

  @ApiOperation({ description: '친구관계 ID 리스트 (all)' })
  @Get(':userId/friendship-ids')
  async getFriendshipIds(
    @Param('userId') userId: number,
    // @Query('status') status: string | undefined,
  ): Promise<AnyData> {
    return this.usersFriendshipService.getFriendshipIds(userId);
  }
}
