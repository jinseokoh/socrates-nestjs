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
import { IcebreakerAnswer } from 'src/domain/icebreakers/entities/icebreaker_answer.entity';
import { Bookmark } from 'src/domain/users/entities/bookmark.entity';
import { Flag } from 'src/domain/users/entities/flag.entity';
import { UserIcebreakerAnswersService } from 'src/domain/users/user-icebreaker_answers.service';
import { Like } from 'src/domain/users/entities/like.entity';

@UseInterceptors(ClassSerializerInterceptor)
@SkipThrottle()
@Controller('users')
export class UserIcebreakerAnswersController {
  constructor(
    private readonly userIcebreakerAnswersService: UserIcebreakerAnswersService,
  ) {}

  //? ----------------------------------------------------------------------- //
  //? 내가 만든 IcebreakerAnswers
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '내가 만든 IcebreakerAnswers (paginated)' })
  @PaginateQueryOptions()
  @Get(':userId/icebreaker-answers')
  async findMyIcebreakerAnswers(
    @Paginate() query: PaginateQuery,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Paginated<IcebreakerAnswer>> {
    return await this.userIcebreakerAnswersService.findMyIcebreakerAnswers(
      query,
      userId,
    );
  }

  @ApiOperation({ description: '내가 만든 IcebreakerAnswers (all)' })
  @Get(':userId/icebreaker-answers/all')
  async loadMyIcebreakers(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<IcebreakerAnswer[]> {
    return await this.userIcebreakerAnswersService.loadMyIcebreakerAnswers(
      userId,
    );
  }

  @ApiOperation({ description: '내가 만든 IcebreakerAnswerIds' })
  @Get(':userId/icebreaker-answers/ids')
  async loadMyIcebreakerAnswerIds(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<number[]> {
    return await this.userIcebreakerAnswersService.loadMyIcebreakerAnswerIds(
      userId,
    );
  }

  //! ----------------------------------------------------------------------- //
  //! 북마크/찜(Bookmark) 생성 (context 상 모호하지만 통일성을 중시해서 추가)
  //! ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'IcebreakerAnswer 북마크/찜 생성' })
  @Post(':userId/icebreaker-answers/:icebreakerAnswerId/bookmark')
  async createIcebreakerAnswerBookmark(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('icebreakerAnswerId', ParseIntPipe) icebreakerAnswerId: number,
  ): Promise<Bookmark> {
    return await this.userIcebreakerAnswersService.createIcebreakerAnswerBookmark(
      userId,
      icebreakerAnswerId,
    );
  }

  @ApiOperation({ description: 'IcebreakerAnswer 북마크/찜 삭제' })
  @Delete(':userId/icebreaker-answers/:icebreakerAnswerId/bookmark')
  async deleteIcebreakerAnswerBookmark(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('icebreakerAnswerId', ParseIntPipe) icebreakerAnswerId: number,
  ): Promise<any> {
    return await this.userIcebreakerAnswersService.deleteIcebreakerAnswerBookmark(
      userId,
      icebreakerAnswerId,
    );
  }

  @ApiOperation({ description: 'IcebreakerAnswer 북마크/찜 여부' })
  @Get(':userId/icebreaker-answers/:icebreakerAnswerId/bookmark')
  async isIcebreakerAnswerBookmarked(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('icebreakerAnswerId', ParseIntPipe) icebreakerAnswerId: number,
  ): Promise<boolean> {
    return await this.userIcebreakerAnswersService.isIcebreakerAnswerBookmarked(
      userId,
      icebreakerAnswerId,
    );
  }

  @ApiOperation({
    description: '내가 북마크/찜한 IcebreakerAnswers (paginated)',
  })
  @PaginateQueryOptions()
  @Get(':userId/bookmarked-icebreaker-answers')
  async listBookmarkedIcebreakerAnswers(
    @Paginate() query: PaginateQuery,
    @Param('userId') userId: number,
  ): Promise<Paginated<IcebreakerAnswer>> {
    return await this.userIcebreakerAnswersService.listBookmarkedIcebreakerAnswers(
      query,
      userId,
    );
  }

  @ApiOperation({ description: '내가 북마크/찜한 IcebreakerAnswers (all)' })
  @Get(':userId/bookmarked-icebreaker-answers/all')
  async loadBookmarkedIcebreakerAnswers(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<IcebreakerAnswer[]> {
    return await this.userIcebreakerAnswersService.loadBookmarkedIcebreakerAnswers(
      userId,
    );
  }

  @ApiOperation({ description: '내가 북마크/찜한 IcebreakerIds' })
  @Get(':userId/bookmarked-icebreaker-answers/ids')
  async loadBookmarkedIcebreakerAnswerIds(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<number[]> {
    return await this.userIcebreakerAnswersService.loadBookmarkedIcebreakerAnswerIds(
      userId,
    );
  }

  //? ----------------------------------------------------------------------- //
  //? IcebreakerAnswer Like 좋아요 생성
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'IcebreakerAnswer 좋아요 생성' })
  @Post(':userId/icebreaker-answers/:icebreakerAnswerId/like')
  async createIcebreakerAnswerLike(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('icebreakerAnswerId', ParseIntPipe) icebreakerAnswerId: number,
  ): Promise<Like> {
    return await this.userIcebreakerAnswersService.createIcebreakerAnswerLike(
      userId,
      icebreakerAnswerId,
    );
  }

  @ApiOperation({ description: 'IcebreakerAnswer 좋아요 삭제' })
  @Delete(':userId/icebreaker-answers/:icebreakerAnswerId/like')
  async deleteIcebreakerAnswerLike(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('icebreakerAnswerId', ParseIntPipe) icebreakerAnswerId: number,
  ): Promise<any> {
    return await this.userIcebreakerAnswersService.deleteIcebreakerAnswerLike(
      userId,
      icebreakerAnswerId,
    );
  }

  @ApiOperation({ description: 'IcebreakerAnswer 좋아요 여부' })
  @Get(':userId/icebreaker-answers/:icebreakerAnswerId/like')
  async isIcebreakerAnswerLiked(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('icebreakerAnswerId', ParseIntPipe) icebreakerAnswerId: number,
  ): Promise<boolean> {
    return await this.userIcebreakerAnswersService.isIcebreakerAnswerLiked(
      userId,
      icebreakerAnswerId,
    );
  }

  @ApiOperation({ description: '내가 좋아요한 IcebreakerAnswers (paginated)' })
  @PaginateQueryOptions()
  @Get(':userId/liked-icebreaker-answers')
  async listLikedIcebreakersByUserId(
    @Paginate() query: PaginateQuery,
    @Param('userId') userId: number,
  ): Promise<Paginated<IcebreakerAnswer>> {
    return await this.userIcebreakerAnswersService.listLikedIcebreakerAnswers(
      query,
      userId,
    );
  }

  @ApiOperation({ description: '내가 좋아요한 모든 IcebreakerAnswers (all)' })
  @Get(':userId/liked-icebreaker-answers/all')
  async loadLikedIcebreakers(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<IcebreakerAnswer[]> {
    return await this.userIcebreakerAnswersService.loadLikedIcebreakerAnswers(
      userId,
    );
  }

  @ApiOperation({ description: '내가 좋아요한 모든 IcebreakerAnswerIds' })
  @Get(':userId/liked-icebreaker-answers/ids')
  async loadLikedIcebreakerIds(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<number[]> {
    return await this.userIcebreakerAnswersService.loadLikedIcebreakerAnswerIds(
      userId,
    );
  }

  //? ----------------------------------------------------------------------- //
  //? IcebreakerAnswer Flag 신고 생성
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'IcebreakerAnswer 신고 생성' })
  @Post(':userId/icebreaker-answers/:icebreakerAnswerId/flag')
  async createIcebreakerAnswerFlag(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('icebreakerAnswerId', ParseIntPipe) icebreakerAnswerId: number,
    @Body('message') message: string | null,
  ): Promise<Flag> {
    return await this.userIcebreakerAnswersService.createIcebreakerAnswerFlag(
      userId,
      icebreakerAnswerId,
      message,
    );
  }

  @ApiOperation({ description: 'IcebreakerAnswer 신고 삭제' })
  @Delete(':userId/icebreaker-answers/:icebreakerAnswerId/flag')
  async deleteIcebreakerAnswerFlag(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('icebreakerAnswerId', ParseIntPipe) icebreakerAnswerId: number,
  ): Promise<any> {
    return await this.userIcebreakerAnswersService.deleteIcebreakerAnswerFlag(
      userId,
      icebreakerAnswerId,
    );
  }

  @ApiOperation({ description: 'IcebreakerAnswer 신고 여부' })
  @Get(':userId/icebreaker-answers/:icebreakerAnswerId/flag')
  async isIcebreakerAnswerFlagged(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('icebreakerAnswerId', ParseIntPipe) icebreakerAnswerId: number,
  ): Promise<boolean> {
    return await this.userIcebreakerAnswersService.isIcebreakerAnswerFlagged(
      userId,
      icebreakerAnswerId,
    );
  }

  @ApiOperation({ description: '내가 신고한 IcebreakerAnswers (paginated)' })
  @PaginateQueryOptions()
  @Get(':userId/flagged-icebreaker-answers')
  async listFlaggedIcebreakersByUserId(
    @Paginate() query: PaginateQuery,
    @Param('userId') userId: number,
  ): Promise<Paginated<IcebreakerAnswer>> {
    return await this.userIcebreakerAnswersService.listFlaggedIcebreakerAnswers(
      query,
      userId,
    );
  }

  @ApiOperation({ description: '내가 신고한 모든 IcebreakerAnswers (all)' })
  @Get(':userId/flagged-icebreaker-answers/all')
  async loadFlaggedIcebreakers(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<IcebreakerAnswer[]> {
    return await this.userIcebreakerAnswersService.loadFlaggedIcebreakerAnswers(
      userId,
    );
  }

  @ApiOperation({ description: '내가 신고한 모든 IcebreakerAnswerIds' })
  @Get(':userId/flagged-icebreaker-answers/ids')
  async loadFlaggedIcebreakerIds(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<number[]> {
    return await this.userIcebreakerAnswersService.loadFlaggedIcebreakerAnswerIds(
      userId,
    );
  }
}
