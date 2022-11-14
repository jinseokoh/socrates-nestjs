import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { Auction } from 'src/domain/auctions/auction.entity';
import { UsersService } from 'src/domain/users/users.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UserAuctionsController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ description: '판매 auctions 리스트' })
  @PaginateQueryOptions()
  @Get(':id/owned_auctions')
  async getOwnedAuctions(
    @Param('id') id: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Auction>> {
    return this.usersService.getOwnedAuctions(id, query);
  }

  @ApiOperation({ description: '입찰 auctions 리스트' })
  @PaginateQueryOptions()
  @Get(':id/bid_auctions')
  async getBidAuctions(
    @Param('id') id: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Auction>> {
    return this.usersService.getBidAuctions(id, query);
  }

  @ApiOperation({ description: '낙찰 auctions 리스트' })
  @PaginateQueryOptions()
  @Get(':id/won_auctions')
  async getWonAuctions(
    @Param('id') id: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Auction>> {
    return this.usersService.getWonAuctions(id, query);
  }

  @ApiOperation({ description: '결제완료 auctions 리스트' })
  @PaginateQueryOptions()
  @Get(':id/paid_auctions')
  async getPaidAuctions(
    @Param('id') id: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Auction>> {
    return this.usersService.getPaidAuctions(id, query);
  }

  @ApiOperation({ description: '북마크 auctions 리스트' })
  @PaginateQueryOptions()
  @Get(':id/bookmark_auctions')
  async getBookmarkAuctions(
    @Param('id') id: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Auction>> {
    return this.usersService.getBookmarkAuctions(id, query);
  }
}
