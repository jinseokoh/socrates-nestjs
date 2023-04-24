import { User } from 'src/domain/users/entities/user.entity';
import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { AnyData } from 'src/common/types';
import { UsersService } from 'src/domain/users/users.service';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { MeetupUser } from 'src/domain/meetups/entities/meetup-user.entity';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UserMeetupsController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ description: '내가 찜한 meetup 리스트' })
  @PaginateQueryOptions()
  @Get(':userId/faves')
  async getFavMeetupsById(
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<MeetupUser>> {
    return this.usersService.getUserFavMeetups(userId, query);
  }

  @ApiOperation({ description: '내가 찜한 meetup 아이디 리스트' })
  @PaginateQueryOptions()
  @Get(':id/faveids')
  async getFavMeetupIdsById(@Param('id') id: number): Promise<AnyData> {
    return this.usersService.getFavMeetupIdsById(id);
  }
}
