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
import { Hate } from 'src/domain/users/entities/hate.entity';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { AnyData } from 'src/common/types';
import { UsersUserService } from 'src/domain/users/users-user.service';
import { Flag } from 'src/domain/users/entities/flag.entity';

@UseInterceptors(ClassSerializerInterceptor)
@SkipThrottle()
@Controller('users')
export class UserUsersController {
  constructor(private readonly usersUserService: UsersUserService) {}

  //?-------------------------------------------------------------------------//
  //? Hate Pivot
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '차단한 사용자 리스트에 추가' })
  @Post(':userId/users-hated/:otherId')
  async attachUserIdToHatePivot(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('otherId', ParseIntPipe) otherId: number,
    @Body('message') message: string | null,
  ): Promise<any> {
    //? checking if this meetup belongs to the user costs a database access,
    //? which you can get around if you design your application carefully.
    //? so user validation has been removed. keep that in mind.
    try {
      await this.usersUserService.attachUserIdToHatePivot(
        userId,
        otherId,
        message,
      );
      return {
        data: 'ok',
      };
    } catch (e) {
      throw new BadRequestException();
    }
  }

  @ApiOperation({ description: '차단한 사용자 리스트에서 삭제' })
  @Delete(':userId/users-hated/:otherId')
  async detachUserIdFromHatePivot(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('otherId', ParseIntPipe) otherId: number,
  ): Promise<any> {
    //? checking if this meetup belongs to the user costs a database access,
    //? which you can get around if you design your application carefully.
    //? so user validation has been removed. keep that in mind.
    try {
      await this.usersUserService.detachUserIdFromHatePivot(userId, otherId);
      return {
        data: 'ok',
      };
    } catch (e) {
      throw new BadRequestException();
    }
  }

  @ApiOperation({ description: '내가 차단한 사용자 리스트 (paginated)' })
  @Get(':userId/users-hated')
  async getUsersHatedByMe(
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Hate>> {
    return this.usersUserService.getUsersHatedByMe(userId, query);
  }

  @ApiOperation({
    description: '내가 차단하거나 나를 차단한 사용자ID 리스트 (all)',
  })
  @Get(':userId/userids-hated')
  async getUserIdsHatedByMe(@Param('userId') userId: number): Promise<AnyData> {
    return this.usersUserService.getUserIdsEitherHatingOrBeingHated(userId);
  }
}
