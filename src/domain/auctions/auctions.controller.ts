import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { NumberData } from 'src/common/types/number-data.type';
import { ArtworksService } from 'src/domain/artworks/artworks.service';
import { Auction } from 'src/domain/auctions/auction.entity';
import { AuctionsService } from 'src/domain/auctions/auctions.service';
import { CreateAuctionDto } from 'src/domain/auctions/dto/create-auction.dto';
import { SyncAuctionUsersDto } from 'src/domain/auctions/dto/sync-auction-users.dto';
import { UpdateAuctionDto } from 'src/domain/auctions/dto/update-auction.dto';
import { DefaultAuctionImagesPipe } from 'src/domain/auctions/pipes/default-auction-images.pipe';
import { GenerateWeeksPipe } from 'src/domain/auctions/pipes/generate-weeks.pipe';
import { ValidateArtworkIdPipe } from 'src/domain/auctions/pipes/validate-artwork-id.pipe';
@UseInterceptors(ClassSerializerInterceptor)
@Controller('auctions')
export class AuctionsController {
  constructor(
    private readonly auctionsService: AuctionsService,
    private readonly artworksService: ArtworksService,
  ) {}

  @ApiOperation({ description: '옥션 생성' })
  @Post()
  async create(
    @Body(ValidateArtworkIdPipe, DefaultAuctionImagesPipe, GenerateWeeksPipe)
    dto: CreateAuctionDto,
  ): Promise<Auction> {
    return await this.auctionsService.create(dto);
  }

  @ApiOperation({ description: '옥션 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get()
  async getAuctions(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Auction>> {
    return this.auctionsService.findAll(query);
  }

  @ApiOperation({ description: '옥션 상세보기' })
  @Get(':id')
  async getAuctionById(@Param('id') id: number): Promise<Auction> {
    await this.artworksService.increase(id);
    return await this.auctionsService.findById(id, [
      'artwork',
      'bids',
      'articles',
      'order',
    ]);
  }

  @ApiOperation({ description: '옥션 히스토리 보기' })
  @Get('history/:year')
  async getHistory(@Param('year') year: number): Promise<any> {
    return await this.auctionsService.getHistory(year);
  }

  @ApiOperation({ description: '옥션 수정' })
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() dto: UpdateAuctionDto,
  ): Promise<Auction> {
    return await this.auctionsService.update(id, dto);
  }

  @ApiOperation({ description: '옥션 삭제' })
  @Delete(':id')
  async remove(@Param('id') id: number): Promise<Auction> {
    return await this.auctionsService.softRemove(id);
  }

  //** extras

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
