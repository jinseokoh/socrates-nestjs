import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
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
import { PleaStatus } from 'src/common/enums';

@UseInterceptors(ClassSerializerInterceptor)
// @SkipThrottle()
@Controller('users')
export class UserPleaController {
  constructor(private readonly usersPleaService: UsersPleaService) {}

  //?-------------------------------------------------------------------------//
  //? Plea Pivot
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

  //--------------------------------------------------------------------------//
  // Read
  //--------------------------------------------------------------------------//

  @ApiOperation({
    description: '내가 모든 사용자에게 받은 요청 리스트 grouped by sender',
  })
  @Get(':myId/pleas-from')
  async getMyReceivedPleas(
    @Param('myId', ParseIntPipe) myId: number,
  ): Promise<Plea[]> {
    return await this.usersPleaService.getMyReceivedPleas(myId);
  }

  @ApiOperation({
    description: '내가 모든 사용자에게 보낸 요청 리스트 grouped by recipient',
  })
  @Get(':myId/pleas-to')
  async getMySentPleas(
    @Param('myId', ParseIntPipe) myId: number,
  ): Promise<Plea[]> {
    return await this.usersPleaService.getMySentPleas(myId);
  }

  @ApiOperation({ description: '내가 이 사용자에게 받은 요청 리스트' })
  @Get(':myId/pleas-from/:userId')
  async getMyReceivedPleasFromThisUser(
    @Param('myId', ParseIntPipe) myId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Plea[]> {
    return await this.usersPleaService.getMyReceivedPleasFromThisUser(
      myId,
      userId,
    );
  }

  @ApiOperation({ description: '내가 이 사용자에게 보낸 요청 리스트' })
  @Get(':myId/pleas-to/:userId')
  async getMySentPleasToThisUser(
    @Param('myId', ParseIntPipe) myId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Plea[]> {
    return await this.usersPleaService.getMySentPleasToThisUser(myId, userId);
  }

  //--------------------------------------------------------------------------//
  // Update
  //--------------------------------------------------------------------------//

  @ApiOperation({ description: '요청 상태 변경' })
  @Patch('pleas/:id')
  async updatePlea(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: PleaStatus,
  ): Promise<Plea> {
    try {
      return await this.usersPleaService.update(id, { status: status });
    } catch (e) {
      throw new BadRequestException();
    }
  }

  //--------------------------------------------------------------------------//
  // Delete
  //--------------------------------------------------------------------------//

  @ApiOperation({ description: '요청 삭제' })
  @Delete('pleas/:id')
  async deletePlea(@Param('id', ParseIntPipe) id: number): Promise<Plea> {
    try {
      return await this.usersPleaService.delete(id);
    } catch (e) {
      throw new BadRequestException();
    }
  }

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
