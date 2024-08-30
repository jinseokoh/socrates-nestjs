import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { IcebreakerAnswerUsersService } from 'src/domain/icebreakers/icebreaker_answer-users.service';
import { User } from 'src/domain/users/entities/user.entity';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('icebreakeranswers')
export class IcebreakerAnswerUsersController {
  constructor(
    private readonly icebreakerAnswerUsersService: IcebreakerAnswerUsersService,
  ) {}

  //? ----------------------------------------------------------------------- //
  //? 북마크 (Bookmark) 리스트
  //? ----------------------------------------------------------------------- //

  @ApiOperation({
    description: '이 아이스브레이커답변을 북마크/찜한 모든 Users',
  })
  @Get(':icebreakerId/bookmarks')
  async loadBookmarkers(
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
  ): Promise<User[]> {
    return await this.icebreakerAnswerUsersService.loadBookmarkers(
      icebreakerId,
    );
  }

  @ApiOperation({
    description: '이 아이스브레이커답변을 북마크/찜한 모든 UserIds',
  })
  @Get(':icebreakerId/bookmarks/ids')
  async loadBookmarkerIds(
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
  ): Promise<number[]> {
    return await this.icebreakerAnswerUsersService.loadBookmarkerIds(
      icebreakerId,
    );
  }

  //? ----------------------------------------------------------------------- //
  //? 좋아요 (Like) 리스트
  //? ----------------------------------------------------------------------- //

  @ApiOperation({
    description: '이 아이스브레이커답변을 북마크/찜한 모든 Users',
  })
  @Get(':icebreakerId/likes')
  async loadLikers(
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
  ): Promise<User[]> {
    return await this.icebreakerAnswerUsersService.loadLikers(icebreakerId);
  }

  @ApiOperation({
    description: '이 아이스브레이커답변을 북마크/찜한 모든 UserIds',
  })
  @Get(':icebreakerId/likes/ids')
  async loadLikerIds(
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
  ): Promise<number[]> {
    return await this.icebreakerAnswerUsersService.loadLikerIds(icebreakerId);
  }

  //? ----------------------------------------------------------------------- //
  //? 신고 (Flag) 리스트
  //? ----------------------------------------------------------------------- //

  @ApiOperation({
    description: '이 아이스브레이커답변을 신고한 모든 Users (all)',
  })
  @Get(':icebreakerId/flags')
  async loadFlaggingUsers(
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
  ): Promise<User[]> {
    return await this.icebreakerAnswerUsersService.loadIcebreakerFlaggingUsers(
      icebreakerId,
    );
  }

  @ApiOperation({
    description: '이 아이스브레이커답변을 신고한 모든 UserIds (all)',
  })
  @Get(':icebreakerId/flags/ids')
  async loadFlaggingUserIds(
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
  ): Promise<number[]> {
    return await this.icebreakerAnswerUsersService.loadIcebreakerFlaggingUserIds(
      icebreakerId,
    );
  }
}
