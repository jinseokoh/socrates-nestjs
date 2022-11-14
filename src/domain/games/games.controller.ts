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
import { Game } from 'src/domain/bids/bid.entity';
import { GamesService } from 'src/domain/bids/bids.service';
import { CreateGameDto } from 'src/domain/bids/dto/create-bid.dto';
import { UpdateGameDto } from 'src/domain/bids/dto/update-bid.dto';

@UseInterceptors(ClassSerializerInterceptor)
@Controller()
export class GamesController {
  constructor(private readonly bidsService: GamesService) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '입찰 생성' })
  @Post('auctions/:auctionId/bids')
  async create(
    @CurrentUserId() userId: number,
    @Param('auctionId') auctionId: number,
    @Body()
    dto: CreateGameDto,
  ): Promise<Game> {
    return await this.bidsService.create({ ...dto, userId, auctionId });
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '모든 입찰 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get('bids')
  async getAllGames(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Game>> {
    return await this.bidsService.findAll(query);
  }

  @ApiOperation({ description: '특정 경매상품 입찰 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get('auctions/:auctionId/bids')
  async getGamesWithAuctionId(
    @Param('auctionId') auctionId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Game>> {
    return await this.bidsService.findAllWithAuctionId(auctionId, query);
  }

  @ApiOperation({ description: '입찰 상세보기' })
  @Get('bids/:bidId')
  async getGameById(@Param('bidId') id: number): Promise<Game> {
    return this.bidsService.findById(id, ['auction', 'user']);
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '입찰 수정' })
  @Patch('bids/:bidId')
  async update(
    @Param('bidId') id: number,
    @Body() dto: UpdateGameDto,
  ): Promise<Game> {
    return await this.bidsService.update(id, dto);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '관리자) 입찰 soft 삭제' })
  @Delete('bids/:bidId')
  async remove(@Param('bidId') id: number): Promise<Game> {
    return await this.bidsService.softRemove(id);
  }
}
