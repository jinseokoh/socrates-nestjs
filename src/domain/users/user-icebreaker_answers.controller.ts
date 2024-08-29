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

import { Bookmark } from 'src/domain/users/entities/bookmark.entity';
import { Flag } from 'src/domain/users/entities/flag.entity';
import { UserIcebreakerAnswersService } from 'src/domain/users/user-icebreaker_answers.service';
import { IcebreakerAnswer } from 'src/domain/icebreakers/entities/icebreaker_answer.entity';

@UseInterceptors(ClassSerializerInterceptor)
@SkipThrottle()
@Controller('users')
export class UserIcebreakerAnswersController {
  constructor(
    private readonly userIcebreakerAnswersService: UserIcebreakerAnswersService,
  ) {}

  //? ----------------------------------------------------------------------- //
  //? 내가 만든 Icebreakers
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '내가 만든 Icebreakers (paginated)' })
  @PaginateQueryOptions()
  @Get(':userId/icebreakers')
  async findMyIcebreakerAnswers(
    @Paginate() query: PaginateQuery,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Paginated<IcebreakerAnswer>> {
    return await this.userIcebreakerAnswersService.findMyIcebreakerAnswers(
      query,
      userId,
    );
  }

  @ApiOperation({ description: '내가 만든 Icebreakers (all)' })
  @Get(':userId/icebreakers/all')
  async loadMyIcebreakers(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Icebreaker[]> {
    return await this.userIcebreakerAnswersService.loadMyIcebreakers(userId);
  }

  @ApiOperation({ description: '내가 만든 IcebreakerIds' })
  @Get(':userId/icebreakerids')
  async loadMyIcebreakerIds(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<number[]> {
    return await this.userIcebreakerAnswersService.loadMyIcebreakerIds(userId);
  }

  //? ----------------------------------------------------------------------- //
  //? 북마크/찜(Bookmark) 생성
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'Icebreaker 북마크/찜 생성' })
  @Post(':userId/bookmarkedicebreakers/:icebreakerId')
  async createIcebreakerBookmark(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
  ): Promise<Bookmark> {
    return await this.userIcebreakerAnswersService.createIcebreakerBookmark(
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
    return await this.userIcebreakerAnswersService.deleteIcebreakerBookmark(
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
    return await this.userIcebreakerAnswersService.isIcebreakerBookmarked(
      userId,
      icebreakerId,
    );
  }

  //? ----------------------------------------------------------------------- //
  //? 내가 북마크/찜(Bookmark)한 Icebreakers
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '내가 북마크/찜한 Icebreakers (paginated)' })
  @PaginateQueryOptions()
  @Get(':userId/bookmarkedicebreakers')
  async listBookmarkedIcebreakers(
    @Paginate() query: PaginateQuery,
    @Param('userId') userId: number,
  ): Promise<Paginated<Icebreaker>> {
    return await this.userIcebreakerAnswersService.listBookmarkedIcebreakers(
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
    return await this.userIcebreakerAnswersService.loadBookmarkedIcebreakers(userId);
  }

  @ApiOperation({ description: '내가 북마크/찜한 IcebreakerIds' })
  @Get(':userId/bookmarkedicebreakerids')
  async loadBookmarkedIcebreakerIds(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<number[]> {
    return await this.userIcebreakerAnswersService.loadBookmarkedIcebreakerIds(
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
    return await this.userIcebreakerAnswersService.createIcebreakerFlag(
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
    return await this.userIcebreakerAnswersService.deleteIcebreakerFlag(
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
    return await this.userIcebreakerAnswersService.isIcebreakerFlagged(
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
    return await this.userIcebreakerAnswersService.listFlaggedIcebreakers(
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
    return await this.userIcebreakerAnswersService.loadFlaggedIcebreakers(userId);
  }

  @ApiOperation({ description: '내가 신고한 모든 IcebreakerIds' })
  @Get(':userId/flaggedicebreakerids')
  async loadFlaggedIcebreakerIds(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<number[]> {
    return await this.userIcebreakerAnswersService.loadFlaggedIcebreakerIds(userId);
  }
}
