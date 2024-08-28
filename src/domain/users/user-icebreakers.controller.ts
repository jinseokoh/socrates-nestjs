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
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { Icebreaker } from 'src/domain/icebreakers/entities/icebreaker.entity';
import { SkipThrottle } from '@nestjs/throttler';

import { BookmarkUserIcebreaker } from 'src/domain/users/entities/bookmark_user_icebreaker.entity';
import { Flag } from 'src/domain/users/entities/flag.entity';
import { UserIcebreakersService } from 'src/domain/users/user-icebreakers.service';

@UseInterceptors(ClassSerializerInterceptor)
@SkipThrottle()
@Controller('users')
export class UserIcebreakersController {
  constructor(
    private readonly userIcebreakersService: UserIcebreakersService,
  ) {}

  //? ----------------------------------------------------------------------- //
  //? 내가 만든 Icebreakers
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '내가 만든 Icebreakers (paginated)' })
  @PaginateQueryOptions()
  @Get(':userId/icebreakers')
  async findMyIcebreakers(
    @Paginate() query: PaginateQuery,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Paginated<Icebreaker>> {
    return await this.userIcebreakersService.findMyIcebreakers(query, userId);
  }

  @ApiOperation({ description: '내가 만든 Icebreakers (all)' })
  @Get(':userId/icebreakers/all')
  async loadMyIcebreakers(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Icebreaker[]> {
    return await this.userIcebreakersService.loadMyIcebreakers(userId);
  }

  @ApiOperation({ description: '내가 만든 IcebreakerIds' })
  @Get(':userId/icebreakerids')
  async loadMyIcebreakerIds(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<number[]> {
    return await this.userIcebreakersService.loadMyIcebreakerIds(userId);
  }

  //? ----------------------------------------------------------------------- //
  //? 북마크/찜(BookmarkUserIcebreaker) 생성
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'Icebreaker 북마크/찜 생성' })
  @Post(':userId/bookmarkedicebreakers/:icebreakerId')
  async createIcebreakerBookmark(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
  ): Promise<BookmarkUserIcebreaker> {
    return await this.userIcebreakersService.createIcebreakerBookmark(
      userId,
      icebreakerId,
    );
  }

  @ApiOperation({ description: 'Icebreaker 북마크/찜 삭제' })
  @Delete(':userId/bookmarkedicebreakers/:icebreakerId')
  async deleteIcebreakerBookmark(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
  ): Promise<any> {
    return await this.userIcebreakersService.deleteIcebreakerBookmark(
      userId,
      icebreakerId,
    );
  }

  @ApiOperation({ description: 'Icebreaker 북마크/찜 여부' })
  @Get(':userId/bookmarkedicebreakers/:icebreakerId')
  async isIcebreakerBookmarked(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
  ): Promise<boolean> {
    return await this.userIcebreakersService.isIcebreakerBookmarked(
      userId,
      icebreakerId,
    );
  }

  //? ----------------------------------------------------------------------- //
  //? 내가 북마크/찜(BookmarkUserIcebreaker)한 Icebreakers
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '내가 북마크/찜한 Icebreakers (paginated)' })
  @PaginateQueryOptions()
  @Get(':userId/bookmarkedicebreakers')
  async listBookmarkedIcebreakers(
    @Paginate() query: PaginateQuery,
    @Param('userId') userId: number,
  ): Promise<Paginated<Icebreaker>> {
    return await this.userIcebreakersService.listBookmarkedIcebreakers(
      query,
      userId,
    );
  }

  //! not working but, do we even need this anyway?
  @ApiOperation({ description: '내가 북마크/찜한 Icebreakers (all)' })
  @Get(':userId/bookmarkedicebreakers/all')
  async loadBookmarkedIcebreakers(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Icebreaker[]> {
    return await this.userIcebreakersService.loadBookmarkedIcebreakers(userId);
  }

  @ApiOperation({ description: '내가 북마크/찜한 IcebreakerIds' })
  @Get(':userId/bookmarkedicebreakerids')
  async loadBookmarkedIcebreakerIds(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<number[]> {
    return await this.userIcebreakersService.loadBookmarkedIcebreakerIds(
      userId,
    );
  }

  //? ----------------------------------------------------------------------- //
  //? Icebreaker Flag 신고 생성
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'Icebreaker 신고 생성' })
  @Post(':userId/flaggedicebreakers/:icebreakerId')
  async createIcebreakerFlag(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
    @Body('message') message: string | null,
  ): Promise<Flag> {
    return await this.userIcebreakersService.createIcebreakerFlag(
      userId,
      icebreakerId,
      message,
    );
  }

  @ApiOperation({ description: 'Icebreaker 신고 삭제' })
  @Delete(':userId/flaggedicebreakers/:icebreakerId')
  async deleteIcebreakerFlag(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
  ): Promise<any> {
    return await this.userIcebreakersService.deleteIcebreakerFlag(
      userId,
      icebreakerId,
    );
  }

  @ApiOperation({ description: 'Icebreaker 신고 여부' })
  @Get(':userId/flaggedicebreakers/:icebreakerId')
  async isIcebreakerFlagged(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
  ): Promise<boolean> {
    return await this.userIcebreakersService.isIcebreakerFlagged(
      userId,
      icebreakerId,
    );
  }

  //? ----------------------------------------------------------------------- //
  //? 내가 신고한 Icebreakers
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '내가 신고한 Icebreakers (paginated)' })
  @PaginateQueryOptions()
  @Get(':userId/flaggedicebreakers')
  async listFlaggedIcebreakersByUserId(
    @Paginate() query: PaginateQuery,
    @Param('userId') userId: number,
  ): Promise<Paginated<Icebreaker>> {
    return await this.userIcebreakersService.listFlaggedIcebreakers(
      query,
      userId,
    );
  }

  //! not working but, do we even need this anyway?
  @ApiOperation({ description: '내가 신고한 모든 Icebreakers (all)' })
  @Get(':userId/flaggedicebreakers/all')
  async loadFlaggedIcebreakers(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Icebreaker[]> {
    return await this.userIcebreakersService.loadFlaggedIcebreakers(userId);
  }

  @ApiOperation({ description: '내가 신고한 모든 IcebreakerIds' })
  @Get(':userId/flaggedicebreakerids')
  async loadFlaggedIcebreakerIds(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<number[]> {
    return await this.userIcebreakersService.loadFlaggedIcebreakerIds(userId);
  }
}
