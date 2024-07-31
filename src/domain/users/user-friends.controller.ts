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
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { CreateFriendshipDto } from 'src/domain/users/dto/create-friendship.dto';
import { UserFriendsService } from 'src/domain/users/user-friends.service';
import { FriendStatus } from 'src/common/enums';
import { User } from 'src/domain/users/entities/user.entity';

@UseInterceptors(ClassSerializerInterceptor)
@SkipThrottle()
@Controller('users')
export class UserFriendshipController {
  constructor(private readonly userFriendsService: UserFriendsService) {}

  //? ----------------------------------------------------------------------- //
  //? Friendship Pivot
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '친구신청 생성' })
  @PaginateQueryOptions()
  @Post(':userId/friendships/:recipientId')
  async createFriendship(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('recipientId', ParseIntPipe) recipientId: number,
    @Body() dto: CreateFriendshipDto,
  ): Promise<User> {
    return await this.userFriendsService.createFriendship({
      ...dto,
      userId,
      recipientId,
    });
  }

  @ApiOperation({ description: '친구신청 삭제' })
  @PaginateQueryOptions()
  @Delete(':userId/friendships/:recipientId')
  async deleteFriendship(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('recipientId', ParseIntPipe) recipientId: number,
  ): Promise<void> {
    await this.userFriendsService.deleteFriendship(userId, recipientId);
  }

  @ApiOperation({ description: '친구신청 수락' })
  @PaginateQueryOptions()
  @Patch(':userId/friendships/:recipientId')
  async updateFriendshipWithStatus(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('recipientId', ParseIntPipe) recipientId: number,
    @Body('status') status: FriendStatus,
  ): Promise<void> {
    await this.userFriendsService.updateFriendshipWithStatus(
      userId,
      recipientId,
      status,
    );
  }

  // ------------------------------------------------------------------------ //

  @ApiOperation({ description: '보낸 친구신청 리스트 (paginated)' })
  @PaginateQueryOptions()
  @Get(':userId/sentfriendships')
  async getFriendshipsSent(
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Friendship>> {
    return await this.userFriendsService.getFriendshipsSent(userId, query);
  }

  @ApiOperation({ description: '받은 친구신청 리스트 (paginated)' })
  @PaginateQueryOptions()
  @Get(':userId/receivedfriendships')
  async getFriendshipsReceived(
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Friendship>> {
    return await this.userFriendsService.getFriendshipsReceived(userId, query);
  }

  @ApiOperation({
    description: '내친구 리스트를 위한, 친구 Users (paginated)',
  })
  @Get(':userId/friends')
  async getMyFriends(
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<User>> {
    return this.userFriendsService.getMyFriends(userId, query);
  }

  // ------------------------------------------------------------------------ //

  @ApiOperation({ description: '친구관계 ID 리스트 (all)' })
  @Get(':userId/friendship-ids')
  async getFriendshipIds(
    @Param('userId') userId: number,
    // @Query('status') status: string | undefined,
  ): Promise<AnyData> {
    return this.userFriendsService.getFriendshipIds(userId);
  }
}
