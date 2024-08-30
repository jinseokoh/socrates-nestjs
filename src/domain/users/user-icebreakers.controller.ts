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
import { SkipThrottle } from '@nestjs/throttler';
import { Icebreaker } from 'src/domain/icebreakers/entities/icebreaker.entity';
import { Bookmark } from 'src/domain/users/entities/bookmark.entity';
import { Flag } from 'src/domain/users/entities/flag.entity';
import { UserIcebreakersService } from 'src/domain/users/user-icebreakers.service';
import { Like } from 'src/domain/users/entities/like.entity';

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
  @Get(':userId/icebreakers/ids')
  async loadMyIcebreakerIds(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<number[]> {
    return await this.userIcebreakersService.loadMyIcebreakerIds(userId);
  }

  //? ----------------------------------------------------------------------- //
  //? 북마크/찜(Bookmark) 생성
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'Icebreaker 북마크/찜 생성' })
  @Post(':userId/icebreakers/:icebreakerId/bookmark')
  async createIcebreakerBookmark(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
  ): Promise<Bookmark> {
    return await this.userIcebreakersService.createIcebreakerBookmark(
      userId,
      icebreakerId,
    );
  }

  @ApiOperation({ description: 'Icebreaker 북마크/찜 삭제' })
  @Delete(':userId/icebreakers/:icebreakerId/bookmark')
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
  @Get(':userId/icebreakers/:icebreakerId/bookmark')
  async isIcebreakerBookmarked(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
  ): Promise<boolean> {
    return await this.userIcebreakersService.isIcebreakerBookmarked(
      userId,
      icebreakerId,
    );
  }

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

  @ApiOperation({ description: '내가 북마크/찜한 Icebreakers (all)' })
  @Get(':userId/bookmarkedicebreakers/all')
  async loadBookmarkedIcebreakers(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Icebreaker[]> {
    return await this.userIcebreakersService.loadBookmarkedIcebreakers(userId);
  }

  @ApiOperation({ description: '내가 북마크/찜한 IcebreakerIds' })
  @Get(':userId/bookmarkedicebreakers/ids')
  async loadBookmarkedIcebreakerIds(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<number[]> {
    return await this.userIcebreakersService.loadBookmarkedIcebreakerIds(
      userId,
    );
  }

  //? ----------------------------------------------------------------------- //
  //? Icebreaker Like 신고 생성
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'Icebreaker 좋아요 생성' })
  @Post(':userId/icebreakers/:icebreakerId/like')
  async createIcebreakerLike(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
  ): Promise<Like> {
    return await this.userIcebreakersService.createIcebreakerLike(
      userId,
      icebreakerId,
    );
  }

  @ApiOperation({ description: 'Icebreaker 좋아요 삭제' })
  @Delete(':userId/icebreakers/:icebreakerId/like')
  async deleteIcebreakerLike(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
  ): Promise<any> {
    return await this.userIcebreakersService.deleteIcebreakerLike(
      userId,
      icebreakerId,
    );
  }

  @ApiOperation({ description: 'Icebreaker 좋아요 여부' })
  @Get(':userId/icebreakers/:icebreakerId/like')
  async isIcebreakerLiked(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
  ): Promise<boolean> {
    return await this.userIcebreakersService.isIcebreakerLiked(
      userId,
      icebreakerId,
    );
  }

  @ApiOperation({ description: '내가 좋아요한 Icebreakers (paginated)' })
  @PaginateQueryOptions()
  @Get(':userId/likedicebreakers')
  async listLikedIcebreakersByUserId(
    @Paginate() query: PaginateQuery,
    @Param('userId') userId: number,
  ): Promise<Paginated<Icebreaker>> {
    return await this.userIcebreakersService.listLikedIcebreakers(
      query,
      userId,
    );
  }

  @ApiOperation({ description: '내가 좋아요한 모든 Icebreakers (all)' })
  @Get(':userId/likedicebreakers/all')
  async loadLikedIcebreakers(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Icebreaker[]> {
    return await this.userIcebreakersService.loadLikedIcebreakers(userId);
  }

  @ApiOperation({ description: '내가 좋아요한 모든 IcebreakerIds' })
  @Get(':userId/likedicebreakers/ids')
  async loadLikedIcebreakerIds(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<number[]> {
    return await this.userIcebreakersService.loadLikedIcebreakerIds(userId);
  }

  //? ----------------------------------------------------------------------- //
  //? Icebreaker Flag 신고 생성
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'Icebreaker 신고 생성' })
  @Post(':userId/icebreakers/:icebreakerId/flag')
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
  @Delete(':userId/icebreakers/:icebreakerId/flag')
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
  @Get(':userId/icebreakers/:icebreakerId/flag')
  async isIcebreakerFlagged(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
  ): Promise<boolean> {
    return await this.userIcebreakersService.isIcebreakerFlagged(
      userId,
      icebreakerId,
    );
  }

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

  @ApiOperation({ description: '내가 신고한 모든 Icebreakers (all)' })
  @Get(':userId/flaggedicebreakers/all')
  async loadFlaggedIcebreakers(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Icebreaker[]> {
    return await this.userIcebreakersService.loadFlaggedIcebreakers(userId);
  }

  @ApiOperation({ description: '내가 신고한 모든 IcebreakerIds' })
  @Get(':userId/flaggedicebreakers/ids')
  async loadFlaggedIcebreakerIds(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<number[]> {
    return await this.userIcebreakersService.loadFlaggedIcebreakerIds(userId);
  }
}
