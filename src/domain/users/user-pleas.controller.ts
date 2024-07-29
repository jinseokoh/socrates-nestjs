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
import { Plea } from 'src/domain/feeds/entities/plea.entity';
import { UserPleasService } from 'src/domain/users/user-pleas.service';

@UseInterceptors(ClassSerializerInterceptor)
// @SkipThrottle()
@Controller('users')
export class UserPleasController {
  constructor(private readonly userPleasService: UserPleasService) {}

  // ------------------------------------------------------------------------ //
  // Read
  // ------------------------------------------------------------------------ //

  @ApiOperation({
    description: '내가 모든 사용자에게 받은 요청 리스트 grouped by user',
  })
  @Get(':userId/pleas-from')
  async getReceivedPleasByUserId(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Plea[]> {
    return await this.userPleasService.getReceivedPleasByUserId(userId);
  }

  @ApiOperation({
    description: '내가 모든 사용자에게 보낸 요청 리스트 grouped by recipient',
  })
  @Get(':userId/pleas-to')
  async getSentPleasByUserId(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Plea[]> {
    return await this.userPleasService.getSentPleasByUserId(userId);
  }

  @ApiOperation({ description: '내가 이 사용자에게 받은 요청 리스트' })
  @Get(':userId/pleas-from/:recipientId')
  async getMyReceivedPleasFromThisUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('recipientId', ParseIntPipe) recipientId: number,
  ): Promise<Plea[]> {
    return await this.userPleasService.getMyReceivedPleasFromThisUser(
      userId,
      recipientId,
    );
  }

  @ApiOperation({ description: '내가 이 사용자에게 보낸 요청 리스트' })
  @Get(':userId/pleas-to/:recipientId')
  async getMySentPleasToThisUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('userId', ParseIntPipe) recipientId: number,
  ): Promise<Plea[]> {
    return await this.userPleasService.getMySentPleasToThisUser(
      userId,
      recipientId,
    );
  }

  // ------------------------------------------------------------------------ //
  // Delete
  // ------------------------------------------------------------------------ //

  @ApiOperation({ description: '내가 이 사용자에게 보낸 요청들 일괄 삭제' })
  @Delete(':userId/pleas/:recipientId')
  async deletePleas(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('recipientId', ParseIntPipe) recipientId: number,
  ): Promise<void> {
    try {
      await this.userPleasService.deletePleas(userId, recipientId);
    } catch (e) {
      throw new BadRequestException();
    }
  }
}
