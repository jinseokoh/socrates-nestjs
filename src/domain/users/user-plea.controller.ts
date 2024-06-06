import {
  BadRequestException,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Plea } from 'src/domain/pleas/entities/plea.entity';
import { UsersPleaService } from 'src/domain/users/users-plea.service';

@UseInterceptors(ClassSerializerInterceptor)
// @SkipThrottle()
@Controller('users')
export class UserPleaController {
  constructor(private readonly usersPleaService: UsersPleaService) {}

  //--------------------------------------------------------------------------//
  // Read
  //--------------------------------------------------------------------------//

  @ApiOperation({
    description: '내가 모든 사용자에게 받은 요청 리스트 grouped by sender',
  })
  @Get(':userId/pleas-from')
  async getReceivedPleasByUserId(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Plea[]> {
    return await this.usersPleaService.getReceivedPleasByUserId(userId);
  }

  @ApiOperation({
    description: '내가 모든 사용자에게 보낸 요청 리스트 grouped by recipient',
  })
  @Get(':userId/pleas-to')
  async getSentPleasByUserId(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Plea[]> {
    return await this.usersPleaService.getSentPleasByUserId(userId);
  }

  @ApiOperation({ description: '내가 이 사용자에게 받은 요청 리스트' })
  @Get(':userId/pleas-from/:otherId')
  async getMyReceivedPleasFromThisUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('otherId', ParseIntPipe) otherId: number,
  ): Promise<Plea[]> {
    return await this.usersPleaService.getMyReceivedPleasFromThisUser(
      userId,
      otherId,
    );
  }

  @ApiOperation({ description: '내가 이 사용자에게 보낸 요청 리스트' })
  @Get(':userId/pleas-to/:otherId')
  async getMySentPleasToThisUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('userId', ParseIntPipe) otherId: number,
  ): Promise<Plea[]> {
    return await this.usersPleaService.getMySentPleasToThisUser(
      userId,
      otherId,
    );
  }

  //--------------------------------------------------------------------------//
  // Delete
  //--------------------------------------------------------------------------//

  @ApiOperation({ description: '요청들 삭제' })
  @Delete(':senderId/pleas/:recipientId')
  async deletePleas(
    @Param('senderId', ParseIntPipe) senderId: number,
    @Param('recipientId', ParseIntPipe) recipientId: number,
  ): Promise<void> {
    try {
      await this.usersPleaService.deletePleas(senderId, recipientId);
    } catch (e) {
      throw new BadRequestException();
    }
  }
}
