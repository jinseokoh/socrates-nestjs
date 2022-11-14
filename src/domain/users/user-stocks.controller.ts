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
import { Stock } from 'src/domain/stocks/stock.entity';
import { StocksService } from 'src/domain/stocks/stocks.service';
@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UserStocksController {
  constructor(private readonly stocksService: StocksService) {}

  @ApiOperation({ description: '나의 stocks 리스트' })
  @PaginateQueryOptions()
  @Get(':id/stocks')
  async getMyStocks(
    @Param('id') id: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Stock>> {
    console.log(id, query);
    return this.stocksService.getMyStocks(id, query);
  }
}
