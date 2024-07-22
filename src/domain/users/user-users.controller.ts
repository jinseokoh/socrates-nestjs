import {
  BadRequestException,
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
import { Hate } from 'src/domain/users/entities/hate.entity';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { AnyData } from 'src/common/types';
import { UserUsersService } from 'src/domain/users/user-users.service';
import { BookmarkUserUserService } from 'src/domain/users/bookmark_user_user.service';
import { FlagsService } from 'src/domain/users/flags.service';
import { BookmarkUserUser } from 'src/domain/users/entities/bookmark_user_user.entity';
import { User } from 'src/domain/users/entities/user.entity';

@UseInterceptors(ClassSerializerInterceptor)
@SkipThrottle()
@Controller('users')
export class UserUsersController {
  constructor(
    private readonly userUsersService: UserUsersService,
    private readonly flagsService: FlagsService,
    private readonly bookmarksService: BookmarkUserUserService,
  ) {}

  //?-------------------------------------------------------------------------//
  //? 내가 북마크(BookmarkUserUser)한 Users
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'User 북마크 생성' })
  @Post(':userId/userbookmarks/:targetUserId')
  async createUserBookmark(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('targetUserId', ParseIntPipe) targetUserId: number,
  ): Promise<any> {
    return await this.bookmarksService.createUserBookmark(userId, targetUserId);
  }

  @ApiOperation({ description: 'User 북마크 삭제' })
  @Delete(':userId/userbookmarks/:targetUserId')
  async deleteUserBookmark(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('targetUserId', ParseIntPipe) targetUserId: number,
  ): Promise<AnyData> {
    return await this.bookmarksService.deleteUserBookmark(userId, targetUserId);
  }

  @ApiOperation({ description: 'User 북마크 여부' })
  @Get(':userId/userbookmarks/:targetUserId')
  async isUserBookmarked(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('targetUserId', ParseIntPipe) targetUserId: number,
  ): Promise<AnyData> {
    return this.bookmarksService.isUserBookmarked(userId, targetUserId);
  }

  @ApiOperation({ description: '내가 북마크한 Users (paginated)' })
  @Get(':userId/bookmarkedusers')
  async findBookmarkedUsers(
    @Param('userId', ParseIntPipe) userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<BookmarkUserUser>> {
    return await this.bookmarksService.findBookmarkedUsers(userId, query);
  }

  @ApiOperation({ description: '내가 북마크한 Users (all)' })
  @Get(':userId/bookmarkedusers/all')
  async loadBookmarkedUsers(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<User[]> {
    return await this.bookmarksService.loadBookmarkedUsers(userId);
  }

  @ApiOperation({ description: '내가 북마크한 UserIds (all)' })
  @Get(':userId/bookmarkeduserids')
  async loadBookmarkedUserIds(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<number[]> {
    return await this.bookmarksService.loadBookmarkedUserIds(userId);
  }

  //?-------------------------------------------------------------------------//
  //? Hate Pivot
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '차단한 사용자 리스트에 추가' })
  @Post(':userId/users-hated/:otherId')
  async attachUserIdToHatePivot(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('otherId', ParseIntPipe) otherId: number,
    @Body('message') message: string | null,
  ): Promise<any> {
    //? checking if this meetup belongs to the user costs a database access,
    //? which you can get around if you design your application carefully.
    //? so user validation has been removed. keep that in mind.
    try {
      await this.userUsersService.attachUserIdToHatePivot(
        userId,
        otherId,
        message,
      );
      return {
        data: 'ok',
      };
    } catch (e) {
      throw new BadRequestException();
    }
  }

  @ApiOperation({ description: '차단한 사용자 리스트에서 삭제' })
  @Delete(':userId/users-hated/:otherId')
  async detachUserIdFromHatePivot(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('otherId', ParseIntPipe) otherId: number,
  ): Promise<any> {
    //? checking if this meetup belongs to the user costs a database access,
    //? which you can get around if you design your application carefully.
    //? so user validation has been removed. keep that in mind.
    try {
      await this.userUsersService.detachUserIdFromHatePivot(userId, otherId);
      return {
        data: 'ok',
      };
    } catch (e) {
      throw new BadRequestException();
    }
  }

  @ApiOperation({ description: '내가 차단한 사용자 리스트 (paginated)' })
  @Get(':userId/users-hated')
  async getUsersHatedByMe(
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Hate>> {
    return this.userUsersService.getUsersHatedByMe(userId, query);
  }

  @ApiOperation({
    description: '내가 차단하거나 나를 차단한 사용자ID 리스트 (all)',
  })
  @Get(':userId/userids-hated')
  async getUserIdsHatedByMe(@Param('userId') userId: number): Promise<AnyData> {
    return this.userUsersService.getUserIdsEitherHatingOrBeingHated(userId);
  }
}
