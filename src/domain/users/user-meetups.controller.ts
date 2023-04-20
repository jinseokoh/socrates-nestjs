import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { UsersService } from 'src/domain/users/users.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UserMeetupsController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ description: '내가 찜한 meetup 아이디 리스트' })
  @PaginateQueryOptions()
  @Get(':id/faves')
  async getUserFavedMeetupIds(@Param('id') id: number): Promise<string[]> {
    return this.usersService.getUserFavedMeetupIds(id);
  }
}
