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
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { AnyData } from 'src/common/types';
import { Flag } from 'src/domain/users/entities/flag.entity';
import { CreateFlagDto } from 'src/domain/users/dto/create-flag.dto';
import { BookmarkUserFeedService } from 'src/domain/users/bookmark_user_feed.service';
import { BookmarkUserFeed } from 'src/domain/users/entities/bookmark_user_feed.entity';

@UseInterceptors(ClassSerializerInterceptor)
@SkipThrottle()
@Controller('users')
export class BookmarkUserFeedController {
  constructor(
    private readonly bookmarkUserFeedService: BookmarkUserFeedService,
  ) {}

  //?-------------------------------------------------------------------------//
  //? BookmarkUserFeed Pivot
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '나의 북마크에서 feed 추가' })
  @Post(':userId/bookmark_user_feed/:feedId')
  async attach(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('feedId', ParseIntPipe) feedId: number,
    @Body('message') message: string | null,
  ): Promise<any> {
    //? checking if this meetup belongs to the user costs a database access,
    //? which you can get around if you design your application carefully.
    //? so user validation has been removed. keep that in mind.
    try {
      return await this.bookmarkUserFeedService.attach(userId, feedId, message);
    } catch (e) {
      throw new BadRequestException();
    }
  }

  @ApiOperation({ description: '나의 북마크에서 feed 제거' })
  @Delete(':userId/bookmark_user_feed/:feedId')
  async detach(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('feedId', ParseIntPipe) feedId: number,
  ): Promise<any> {
    //? checking if this meetup belongs to the user costs a database access,
    //? which you can get around if you design your application carefully.
    //? so user validation has been removed. keep that in mind.
    try {
      return await this.bookmarkUserFeedService.detach(userId, feedId);
    } catch (e) {
      throw new BadRequestException();
    }
  }

  @ApiOperation({ description: '내가 북마크한 feed 리스트 (paginated)' })
  @Get(':userId/bookmark_user_feed')
  async getUsersBookmarkedByMe(
    @Param('userId', ParseIntPipe) userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<BookmarkUserFeed>> {
    return this.bookmarkUserFeedService.getFeedsBookmarkedByMe(userId, query);
  }

  @ApiOperation({ description: '내가 북마크한 feedIds 리스트' })
  @Get(':userId/bookmark_user_feed/ids')
  async getAllUserIdsBookmarkedByMe(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<number[]> {
    return await this.bookmarkUserFeedService.getAllIdsBookmarkedByMe(userId);
  }

  @ApiOperation({
    description: '내가 북마크한 feed 여부',
  })
  @Get(':userId/bookmark_user_feed/:feedId')
  async isBookmarked(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('feedId', ParseIntPipe) feedId: number,
  ): Promise<AnyData> {
    return this.bookmarkUserFeedService.isBookmarked(userId, feedId);
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
    return await this.bookmarkUserFeedService.createFlag({ ...dto, userId });
  }
}
