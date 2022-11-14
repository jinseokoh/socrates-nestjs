import {
  BadRequestException,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { Follow } from 'src/domain/follows/follow.entity';
import { FollowsService } from 'src/domain/follows/follows.service';
import { User } from '../users/user.entity';
@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post(':myUserId/follows/:otherUserId')
  @ApiOperation({ description: '팔로' })
  async follow(
    @CurrentUserId() id: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Param('myUserId') _myUserId: number,
    @Param('otherUserId') otherUserId: number,
  ): Promise<Follow> {
    if (id === otherUserId) {
      throw new BadRequestException(`invalid following target`);
    }
    return await this.followsService.follow(id, otherUserId);
  }

  @Get(':myUserId/followers')
  @ApiOperation({ description: '나를 팔로하는 사용자 리스트 w/ Pagination' })
  async getFollowers(
    @Param('myUserId') myUserId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<User>> {
    return await this.followsService.findAllFollowers(myUserId, query);
  }

  @Get(':myUserId/followings')
  @ApiOperation({ description: '내가 팔로하는 사용자 리스트 w/ Pagination' })
  async getFollowings(
    @Param('myUserId') myUserId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<User>> {
    return await this.followsService.findAllFollowings(myUserId, query);
  }

  @Delete(':myUserId/follows/:otherUserId')
  @ApiOperation({ description: '언팔' })
  async unfollow(
    @CurrentUserId() id: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Param('myUserId') _myUserId: number,
    @Param('otherUserId') otherUserId: number,
  ): Promise<Follow> {
    if (id === otherUserId) {
      throw new BadRequestException(`invalid following target`);
    }
    return await this.followsService.unfollow(id, otherUserId);
  }
}
