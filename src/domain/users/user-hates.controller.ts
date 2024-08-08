import {
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
import { UserHatesService } from 'src/domain/users/user-hates.service';
import { User } from 'src/domain/users/entities/user.entity';

@UseInterceptors(ClassSerializerInterceptor)
@SkipThrottle()
@Controller('users')
export class UserHatesController {
  constructor(private readonly userHatesService: UserHatesService) {}

  //? ----------------------------------------------------------------------- //
  //? 내가 차단(Hate)한 Users
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '사용자 차단 추가' })
  @Post(':userId/hates/:recipientId')
  async createUserHate(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('recipientId', ParseIntPipe) recipientId: number,
  ): Promise<Hate> {
    return await this.userHatesService.createUserHate(userId, recipientId);
  }

  @ApiOperation({ description: '사용자 차단 삭제' })
  @Delete(':userId/hates/:recipientId')
  async deleteUserHate(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('recipientId', ParseIntPipe) recipientId: number,
  ): Promise<Hate> {
    return await this.userHatesService.deleteUserHate(userId, recipientId);
  }

  @ApiOperation({ description: '내가 차단한 Users (paginated)' })
  @Get(':userId/hatedusers')
  async listUsersBlockedByMe(
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<User>> {
    return this.userHatesService.listBlockedUsers(userId, query);
  }

  //! do we even need this?
  @ApiOperation({ description: '내가 차단한 Users (all)' })
  @Get(':userId/hatedusers/all')
  async loadAllUsersBlockedByMe(
    @Param('userId') userId: number,
  ): Promise<User[]> {
    return this.userHatesService.loadBlockedUsers(userId);
  }

  @ApiOperation({
    description: '내가 차단했거나 나를 차단한 UserIds (all)',
  })
  @Get(':userId/hateduserids')
  async loadBlockedUserIdsInEitherWay(
    @Param('userId') userId: number,
  ): Promise<number[]> {
    return this.userHatesService.loadBlockedUserIdsInEitherWay(userId);
  }
}
