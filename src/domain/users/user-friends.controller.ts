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
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { CreateFriendshipDto } from 'src/domain/users/dto/create-friendship.dto';
import { UserFriendsService } from 'src/domain/users/user-friends.service';

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
  @Post(':userId/friendships')
  async createFriendship(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: CreateFriendshipDto,
  ): Promise<Friendship> {
    return await this.userFriendsService.createFriendship({ ...dto, userId });
  }

  @ApiOperation({ description: '친구신청 삭제' })
  @PaginateQueryOptions()
  @Delete(':userId/friendships/:id')
  async deleteFriendship(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Friendship> {
    return await this.userFriendsService.deleteFriendship(userId, id);
  }

  @ApiOperation({ description: '친구신청 수락' })
  @PaginateQueryOptions()
  @Patch(':userId/friendships/:id')
  async acceptFriendship(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Friendship> {
    return await this.userFriendsService.acceptFriendship(userId, id);
  }

  @ApiOperation({ description: '현재 friendIds and pendingIds (all)' })
  @Get(':userId/friendships')
  async loadFriendships(@Param('userId') userId: number): Promise<{
    pendingIds: number[];
    friendIds: number[];
  }> {
    return this.userFriendsService.loadFriendships(userId);
  }

  @ApiOperation({ description: 'friend 관계인 UserIds (all)' })
  @Get(':userId/friendids')
  async loadFriendUserIds(@Param('userId') userId: number): Promise<number[]> {
    return this.userFriendsService.loadFriendUserIds(userId);
  }

  @ApiOperation({ description: 'pending 친구관계인 UserIds (all)' })
  @Get(':userId/pendingids')
  async loadPendingFriendshipUserIds(
    @Param('userId') userId: number,
  ): Promise<number[]> {
    return this.userFriendsService.loadPendingFriendUserIds(userId);
  }

  // ------------------------------------------------------------------------ //

  @ApiOperation({ description: '내가 친구신청 보낸 Friendships (paginated)' })
  @PaginateQueryOptions()
  @Get(':userId/sentfriendships')
  async listSentFriendships(
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Friendship>> {
    return await this.userFriendsService.listSentFriendships(userId, query);
  }

  @ApiOperation({ description: '내가 친구신청 받은 Friendships (paginated)' })
  @PaginateQueryOptions()
  @Get(':userId/receivedfriendships')
  async listReceivedFriendships(
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Friendship>> {
    return await this.userFriendsService.listReceivedFriendships(userId, query);
  }

  @ApiOperation({ description: '현재 친구관계인 Users (paginated)' })
  @Get(':userId/friends')
  async listMyFriends(
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Friendship>> {
    return this.userFriendsService.listMyFriends(userId, query);
  }
}
