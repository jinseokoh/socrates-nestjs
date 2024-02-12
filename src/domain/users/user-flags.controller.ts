import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { UsersService } from 'src/domain/users/users.service';
import { Flag } from 'src/domain/users/entities/flag.entity';
import { SkipThrottle } from '@nestjs/throttler';
import { CreateFlagDto } from 'src/domain/users/dto/create-flag.dto';

@UseInterceptors(ClassSerializerInterceptor)
@SkipThrottle()
@Controller('users')
export class UserFlagsController {
  constructor(private readonly usersService: UsersService) {}

  //?-------------------------------------------------------------------------//
  //? 내가 만든 발견 리스트
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '사용자 댓글 신고' })
  @PaginateQueryOptions()
  @Post(':userId/flags')
  async createFlagComment(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: CreateFlagDto,
  ): Promise<Flag> {
    return await this.usersService.createFlag({ ...dto, userId });
  }
}
