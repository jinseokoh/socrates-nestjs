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
import { BookmarkUserUser } from 'src/domain/users/entities/bookmark_user_user.entity';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { AnyData } from 'src/common/types';
import { Flag } from 'src/domain/users/entities/flag.entity';
import { CreateFlagDto } from 'src/domain/users/dto/create-flag.dto';
import { BookmarkUserUserService } from 'src/domain/users/bookmark_user_user.service';

@UseInterceptors(ClassSerializerInterceptor)
@SkipThrottle()
@Controller('users')
export class BookmarkUserUserController {
  constructor(
    private readonly bookmarkUserUserService: BookmarkUserUserService,
  ) {}

  //?-------------------------------------------------------------------------//
  //? BookmarkUserUser Pivot
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '나의 북마크에서 user 추가' })
  @Post(':userId/bookmark_user_user/:bookmarkedUserId')
  async attach(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('bookmarkedUserId', ParseIntPipe) bookmarkedUserId: number,
    @Body('message') message: string | null,
  ): Promise<any> {
    //? checking if this meetup belongs to the user costs a database access,
    //? which you can get around if you design your application carefully.
    //? so user validation has been removed. keep that in mind.
    try {
      return await this.bookmarkUserUserService.attach(
        userId,
        bookmarkedUserId,
        message,
      );
    } catch (e) {
      throw new BadRequestException();
    }
  }

  @ApiOperation({ description: '나의 북마크에서 user 제거' })
  @Delete(':userId/bookmark_user_user/:bookmarkedUserId')
  async detach(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('bookmarkedUserId', ParseIntPipe) bookmarkedUserId: number,
  ): Promise<AnyData> {
    //? checking if this meetup belongs to the user costs a database access,
    //? which you can get around if you design your application carefully.
    //? so user validation has been removed. keep that in mind.
    try {
      return await this.bookmarkUserUserService.detach(
        userId,
        bookmarkedUserId,
      );
    } catch (e) {
      throw new BadRequestException();
    }
  }

  @ApiOperation({ description: '내가 북마크한 user 리스트 (paginated)' })
  @Get(':userId/bookmark_user_user')
  async getUsersBookmarkedByMe(
    @Param('userId', ParseIntPipe) userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<BookmarkUserUser>> {
    return await this.bookmarkUserUserService.getUsersBookmarkedByMe(
      userId,
      query,
    );
  }

  @ApiOperation({ description: '내가 북마크한 userIds 리스트' })
  @Get(':userId/bookmark_user_user/ids')
  async getAllUserIdsBookmarkedByMe(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<number[]> {
    return await this.bookmarkUserUserService.getAllIdsBookmarkedByMe(userId);
  }

  @ApiOperation({
    description: '내가 북마크한 user 여부',
  })
  @Get(':userId/bookmark_user_user/:bookmarkedUserId')
  async isBookmarked(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('bookmarkedUserId', ParseIntPipe) bookmarkedUserId: number,
  ): Promise<AnyData> {
    return this.bookmarkUserUserService.isBookmarked(userId, bookmarkedUserId);
  }

  //?-------------------------------------------------------------------------//
  //? 내가 만든 발견 리스트
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '사용자 댓글 신고' })
  @Post(':userId/flags')
  async createFlagOpinion(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: CreateFlagDto,
  ): Promise<Flag> {
    return await this.bookmarkUserUserService.createFlag({ ...dto, userId });
  }
}
