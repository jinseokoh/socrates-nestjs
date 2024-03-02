import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Plea } from 'src/domain/users/entities/plea.entity';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { CreatePleaDto } from 'src/domain/users/dto/create-plea.dto';
import { UsersPleaService } from 'src/domain/users/users-plea.service';
import { User } from 'src/domain/users/entities/user.entity';

@UseInterceptors(ClassSerializerInterceptor)
@SkipThrottle()
@Controller('users')
export class UserPleaController {
  constructor(private readonly usersPleaService: UsersPleaService) {}

  //?-------------------------------------------------------------------------//
  //? Plea Pivot (어쩌면 will be deprecated)
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '요청 생성' })
  @PaginateQueryOptions()
  @Post(':senderId/pleas/:recipientId/dots/:dotId')
  async attachToPleaPivot(
    @Param('senderId', ParseIntPipe) senderId: number,
    @Param('recipientId', ParseIntPipe) recipientId: number,
    @Param('dotId', ParseIntPipe) dotId: number,
    @Body() dto: CreatePleaDto,
  ): Promise<Plea> {
    const newDto = {
      ...dto,
      senderId,
      recipientId,
      dotId,
    };

    return await this.usersPleaService.createPlea(newDto);
  }

  @ApiOperation({ description: '내가 이 사용자에게 보낸 요청 리스트' })
  @Get(':senderId/pleas/:recipientId')
  async getPleasForThisUser(
    @Param('senderId', ParseIntPipe) senderId: number,
    @Param('recipientId', ParseIntPipe) recipientId: number,
  ): Promise<Plea[]> {
    return await this.usersPleaService.getPleasForThisUser(
      senderId,
      recipientId,
    );
  }

  @ApiOperation({ description: '내게 요청한 사용자 리스트' })
  @Get(':userId/users-pleaded')
  async getUniqueUsersPleaded(
    @Param('userId') userId: number,
  ): Promise<User[]> {
    return await this.usersPleaService.getUniqueUsersPleaded(userId);
  }
}
