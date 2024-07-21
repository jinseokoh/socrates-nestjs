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
import { Feed } from 'src/domain/feeds/entities/feed.entity';
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
}
