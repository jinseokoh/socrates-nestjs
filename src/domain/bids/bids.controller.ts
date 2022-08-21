import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { Bid } from 'src/domain/bids/bid.entity';
import { BidsService } from 'src/domain/bids/bids.service';
import { CreateBidDto } from 'src/domain/bids/dto/create-bid.dto';
import { UpdateBidDto } from 'src/domain/bids/dto/update-bid.dto';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('auctions')
export class BidsController {
  constructor(private readonly bidsService: BidsService) {}

  @ApiOperation({ description: '입찰 생성' })
  @Post(':auctionId/bids')
  async create(
    @CurrentUserId() userId: number,
    @Param('auctionId') auctionId: number,
    @Body()
    dto: CreateBidDto,
  ): Promise<Bid> {
    return await this.bidsService.create({ ...dto, userId, auctionId });
  }

  @ApiOperation({ description: '입찰 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get(':auctionId/bids')
  async getBids(@Paginate() query: PaginateQuery): Promise<Paginated<Bid>> {
    return await this.bidsService.findAll(query);
  }

  @ApiOperation({ description: '입찰 상세보기' })
  @Get(':auctionId/bids/:bidId')
  async getBidById(@Param('bidId') id: number): Promise<Bid> {
    return this.bidsService.findById(id, ['user']);
  }

  @ApiOperation({ description: '입찰 수정' })
  @Patch(':auctionId/bids/:bidId')
  async update(
    @Param('bidId') id: number,
    @Body() dto: UpdateBidDto,
  ): Promise<Bid> {
    return await this.bidsService.update(id, dto);
  }

  @ApiOperation({ description: '관리자) 입찰 soft 삭제' })
  @Delete(':auctionId/bids/:bidId')
  async remove(@Param('bidId') id: number): Promise<Bid> {
    return await this.bidsService.softRemove(id);
  }
}
