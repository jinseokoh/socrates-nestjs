import {
  BadRequestException,
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
import { UsersService } from 'src/domain/users/users.service';
import { SkipThrottle } from '@nestjs/throttler';
import { AnyData } from 'src/common/types';

@UseInterceptors(ClassSerializerInterceptor)
@SkipThrottle()
@Controller('users')
export class UserUsersController {
  constructor(private readonly usersService: UsersService) {}

  //?-------------------------------------------------------------------------//
  //? Hate Pivot
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '나의 차단 리스트에 추가' })
  @Post(':userId/hates/:otherId')
  async attachToLikePivot(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('otherId', ParseIntPipe) otherId: number,
  ): Promise<any> {
    //? checking if this meetup belongs to the user costs a database access,
    //? which you can get around if you design your application carefully.
    //? so user validation has been removed. keep that in mind.

    console.log(userId, otherId);
    try {
      await this.usersService.attachToHatePivot(userId, otherId, null);
      return {
        data: 'ok',
      };
    } catch (e) {
      throw new BadRequestException();
    }
  }

  @ApiOperation({ description: '나의 챠단 리스트에서 삭제' })
  @Delete(':userId/hates/:otherId')
  async detachFromLikePivot(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('otherId', ParseIntPipe) otherId: number,
  ): Promise<any> {
    //? checking if this meetup belongs to the user costs a database access,
    //? which you can get around if you design your application carefully.
    //? so user validation has been removed. keep that in mind.
    try {
      await this.usersService.detachFromHatePivot(userId, otherId);
      return {
        data: 'ok',
      };
    } catch (e) {
      throw new BadRequestException();
    }
  }

  @ApiOperation({ description: '내가 찜한 모임ID 리스트' })
  @Get(':userId/hateids')
  async getUserIdsHatedByMe(@Param('userId') userId: number): Promise<AnyData> {
    return this.usersService.getUserIdsHatedByMe(userId);
  }
}
