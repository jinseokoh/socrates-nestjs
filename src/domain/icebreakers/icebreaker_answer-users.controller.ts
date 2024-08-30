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
@Controller('icebreaker-answers')
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
  @Get(':icebreakerAnswerId/bookmarks')
  async loadBookmarkers(
    @Param('icebreakerAnswerId', ParseIntPipe) icebreakerAnswerId: number,
  ): Promise<User[]> {
    return await this.icebreakerAnswerUsersService.loadBookmarkers(
      icebreakerAnswerId,
    );
  }

  @ApiOperation({
    description: '이 아이스브레이커답변을 북마크/찜한 모든 UserIds',
  })
  @Get(':icebreakerAnswerId/bookmarks/ids')
  async loadBookmarkerIds(
    @Param('icebreakerAnswerId', ParseIntPipe) icebreakerAnswerId: number,
  ): Promise<number[]> {
    return await this.icebreakerAnswerUsersService.loadBookmarkerIds(
      icebreakerAnswerId,
    );
  }

  //? ----------------------------------------------------------------------- //
  //? 좋아요 (Like) 리스트
  //? ----------------------------------------------------------------------- //

  @ApiOperation({
    description: '이 아이스브레이커답변을 북마크/찜한 모든 Users',
  })
  @Get(':icebreakerAnswerId/likes')
  async loadLikers(
    @Param('icebreakerAnswerId', ParseIntPipe) icebreakerAnswerId: number,
  ): Promise<User[]> {
    return await this.icebreakerAnswerUsersService.loadLikers(
      icebreakerAnswerId,
    );
  }

  @ApiOperation({
    description: '이 아이스브레이커답변을 북마크/찜한 모든 UserIds',
  })
  @Get(':icebreakerAnswerId/likes/ids')
  async loadLikerIds(
    @Param('icebreakerAnswerId', ParseIntPipe) icebreakerAnswerId: number,
  ): Promise<number[]> {
    return await this.icebreakerAnswerUsersService.loadLikerIds(
      icebreakerAnswerId,
    );
  }

  //? ----------------------------------------------------------------------- //
  //? 신고 (Flag) 리스트
  //? ----------------------------------------------------------------------- //

  @ApiOperation({
    description: '이 아이스브레이커답변을 신고한 모든 Users (all)',
  })
  @Get(':icebreakerAnswerId/flags')
  async loadFlaggingUsers(
    @Param('icebreakerAnswerId', ParseIntPipe) icebreakerAnswerId: number,
  ): Promise<User[]> {
    return await this.icebreakerAnswerUsersService.loadIcebreakerFlaggingUsers(
      icebreakerAnswerId,
    );
  }

  @ApiOperation({
    description: '이 아이스브레이커답변을 신고한 모든 UserIds (all)',
  })
  @Get(':icebreakerAnswerId/flags/ids')
  async loadFlaggingUserIds(
    @Param('icebreakerAnswerId', ParseIntPipe) icebreakerAnswerId: number,
  ): Promise<number[]> {
    return await this.icebreakerAnswerUsersService.loadIcebreakerFlaggingUserIds(
      icebreakerAnswerId,
    );
  }
}
