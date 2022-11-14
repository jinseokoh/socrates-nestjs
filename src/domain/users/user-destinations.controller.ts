import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Patch,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { Destination } from 'src/domain/destinations/destination.entity';
import { DestinationsService } from 'src/domain/destinations/destinations.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UserDestinationsController {
  constructor(private readonly destinationsService: DestinationsService) {}

  @ApiOperation({ description: '나의 배송목록 리스트' })
  @PaginateQueryOptions()
  @Get(':id/destinations')
  async getList(
    @Param('id') id: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Destination>> {
    console.log(id, query);
    return this.destinationsService.getMyDestinations(id, query);
  }

  @ApiOperation({ description: '나의 배송목록 기본배송지 설정' })
  @PaginateQueryOptions()
  @Patch(':id/destinations/:destinationId/default')
  async getMyStocks(
    @Param('id') id: number,
    @Param('destinationId') destinationId: number,
  ): Promise<void> {
    return this.destinationsService.makeDefault(id, destinationId);
  }
}
