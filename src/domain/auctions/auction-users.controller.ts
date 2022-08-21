import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Param,
  Post,
  Put,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { NumberData } from 'src/common/types/number-data.type';
import { Auction } from 'src/domain/auctions/auction.entity';
import { AuctionsService } from 'src/domain/auctions/auctions.service';
import { SyncAuctionUsersDto } from 'src/domain/auctions/dto/sync-auction-users.dto';
@UseInterceptors(ClassSerializerInterceptor)
@Controller('auctions')
export class AuctionUsersController {
  constructor(private readonly auctionsService: AuctionsService) {}

  @ApiOperation({ description: '옥션 관심사용자 일괄등록' })
  @Post(':id/users')
  async sync(
    @Param('id') id: number,
    @Body() dto: SyncAuctionUsersDto,
  ): Promise<Auction> {
    return await this.auctionsService.sync(id, dto);
  }

  @ApiOperation({ description: '옥션 관심사용자 추가' })
  @Put(':auctionId/users/:userId')
  async attach(
    @CurrentUserId() id: number,
    @Param('auctionId') auctionId: number,
    @Param('userId') userId: number,
  ): Promise<NumberData> {
    if (id !== userId) {
      throw new BadRequestException(`doh! mind your id`);
    }
    const { affectedRows } = await this.auctionsService.attach(
      auctionId,
      userId,
    );
    return { data: affectedRows };
  }

  @ApiOperation({ description: '옥션 관심사용자 삭제' })
  @Delete(':auctionId/users/:userId')
  async detach(
    @CurrentUserId() id: number,
    @Param('auctionId') auctionId: number,
    @Param('userId') userId: number,
  ): Promise<NumberData> {
    if (id !== userId) {
      throw new BadRequestException(`doh! mind your id`);
    }
    const { affectedRows } = await this.auctionsService.detach(
      auctionId,
      userId,
    );
    return { data: affectedRows };
  }
}
