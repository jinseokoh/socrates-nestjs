import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { IcebreakerUsersService } from 'src/domain/icebreakers/icebreaker-users.service';
import { User } from 'src/domain/users/entities/user.entity';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('icebreakers')
export class IcebreakerUsersController {
  constructor(
    private readonly icebreakerUsersService: IcebreakerUsersService,
  ) {}

  //? ----------------------------------------------------------------------- //
  //? 북마크 (BookmarkUserIcebreaker) 리스트
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '이 모임을 북마크/찜한 모든 Users' })
  @Get(':icebreakerId/bookmarkers')
  async loadBookmarkers(
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
  ): Promise<User[]> {
    return await this.icebreakerUsersService.loadBookmarkers(icebreakerId);
  }

  @ApiOperation({ description: '이 모임을 북마크/찜한 모든 UserIds' })
  @Get(':icebreakerId/bookmarkerids')
  async loadBookmarkerIds(
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
  ): Promise<number[]> {
    return await this.icebreakerUsersService.loadBookmarkerIds(icebreakerId);
  }

  //? ----------------------------------------------------------------------- //
  //? 신고 (Flag) 리스트
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '이 모임을 신고한 모든 Users (all)' })
  @Get(':icebreakerId/flaggers')
  async loadFlaggingUsers(
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
  ): Promise<User[]> {
    return await this.icebreakerUsersService.loadIcebreakerFlaggingUsers(
      icebreakerId,
    );
  }

  @ApiOperation({ description: '이 모임을 신고한 모든 UserIds (all)' })
  @Get(':icebreakerId/flaggerids')
  async loadFlaggingUserIds(
    @Param('icebreakerId', ParseIntPipe) icebreakerId: number,
  ): Promise<number[]> {
    return await this.icebreakerUsersService.loadIcebreakerFlaggingUserIds(
      icebreakerId,
    );
  }
}
