import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { AnyData } from 'src/common/types';
import { BookmarkUserUserService } from 'src/domain/users/bookmark_user_user.service';
import { FlagUserService } from 'src/domain/users/flag_user.service';
import { User } from 'src/domain/users/entities/user.entity';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';

@UseInterceptors(ClassSerializerInterceptor)
@SkipThrottle()
@Controller('users')
export class UserUsersController {
  constructor(
    private readonly flagsService: FlagUserService,
    private readonly bookmarksService: BookmarkUserUserService,
  ) {}

  //?-------------------------------------------------------------------------//
  //? 내가 북마크(BookmarkUserUser)한 Users
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'User 북마크 생성' })
  @Post(':userId/userbookmarks/:recipientId')
  async createUserBookmark(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('recipientId', ParseIntPipe) recipientId: number,
  ): Promise<any> {
    return await this.bookmarksService.createUserBookmark(userId, recipientId);
  }

  @ApiOperation({ description: 'User 북마크 삭제' })
  @Delete(':userId/userbookmarks/:recipientId')
  async deleteUserBookmark(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('recipientId', ParseIntPipe) recipientId: number,
  ): Promise<AnyData> {
    return await this.bookmarksService.deleteUserBookmark(userId, recipientId);
  }

  @ApiOperation({ description: 'User 북마크 여부' })
  @Get(':userId/userbookmarks/:recipientId')
  async isUserBookmarked(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('recipientId', ParseIntPipe) recipientId: number,
  ): Promise<AnyData> {
    return this.bookmarksService.isUserBookmarked(userId, recipientId);
  }

  @ApiOperation({ description: '내가 북마크한/follow중인 Users (paginated)' })
  @Get(':userId/bookmarkedusers')
  async findBookmarkedUsers(
    @Param('userId', ParseIntPipe) userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<User>> {
    return await this.bookmarksService.findBookmarkedUsers(query, userId);
  }

  @ApiOperation({ description: '내가 북마크한/follow중인 Users (all)' })
  @Get(':userId/bookmarkedusers/all')
  async loadBookmarkedUsers(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<User[]> {
    return await this.bookmarksService.loadBookmarkedUsers(userId);
  }

  @ApiOperation({ description: '내가 북마크한/follow중인 UserIds (all)' })
  @Get(':userId/bookmarkeduserids')
  async loadBookmarkedUserIds(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<number[]> {
    return await this.bookmarksService.loadBookmarkedUserIds(userId);
  }

  //?-------------------------------------------------------------------------//
  //? 내가 신고(Flag)한 Users
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'User 신고 생성' })
  @Post(':userId/userflags/:recipientId')
  async createUserFlag(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('recipientId', ParseIntPipe) recipientId: number,
    @Body('message') message: string | null,
  ): Promise<any> {
    return await this.flagsService.createUserFlag(userId, recipientId, message);
  }

  @ApiOperation({ description: 'User 신고 삭제' })
  @Delete(':userId/userflags/:recipientId')
  async deleteUserFlag(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('recipientId', ParseIntPipe) recipientId: number,
  ): Promise<any> {
    return await this.flagsService.deleteUserFlag(userId, recipientId);
  }

  @ApiOperation({ description: 'User 신고 여부' })
  @Get(':userId/userflags/:recipientId')
  async isUserFlagged(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('recipientId', ParseIntPipe) recipientId: number,
  ): Promise<AnyData> {
    return {
      data: await this.flagsService.isUserFlagged(userId, recipientId),
    };
  }

  @ApiOperation({ description: '내가 신고한 Users (paginated)' })
  @PaginateQueryOptions()
  @Get(':userId/flaggedusers')
  async findFlaggedUsersByUserId(
    @Paginate() query: PaginateQuery,
    @Param('userId') userId: number,
  ): Promise<Paginated<User>> {
    return await this.flagsService.findFlaggedUsers(query, userId);
  }

  @ApiOperation({ description: '내가 신고한 모든 Users (all)' })
  @Get(':userId/flaggedusers/all')
  async loadFlaggedUsers(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<User[]> {
    return await this.flagsService.loadFlaggedUsers(userId);
  }

  @ApiOperation({ description: '내가 신고한 모든 UserIds' })
  @Get(':userId/flaggeduserids')
  async loadFlaggedUserIds(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<number[]> {
    return await this.flagsService.loadFlaggedUserIds(userId);
  }

  @ApiOperation({ description: '나를 신고한 모든 Users (all)' })
  @Get(':userId/flaggingusers/all')
  async loadFlaggingUsers(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<User[]> {
    return await this.flagsService.loadUserFlaggingUsers(userId);
  }

  @ApiOperation({ description: '나를 신고한 모든 UserIds' })
  @Get(':userId/flagginguserids')
  async loadFlaggingUserIds(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<number[]> {
    return await this.flagsService.loadUserFlaggingUserIds(userId);
  }
}
