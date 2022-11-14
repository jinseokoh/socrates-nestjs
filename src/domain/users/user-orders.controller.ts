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
import { Order } from 'src/domain/orders/order.entity';
import { OrdersService } from 'src/domain/orders/orders.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UserOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiOperation({ description: '나의 구매목록 리스트' })
  @PaginateQueryOptions()
  @Get(':id/orders')
  async getList(
    @Param('id') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Order>> {
    return this.ordersService.findAllByUserId(userId, query);
  }

  // @ApiOperation({ description: '나의 배송목록 기본배송지 설정' })
  // @PaginateQueryOptions()
  // @Patch(':id/orders/:orderId/default')
  // async getMyStocks(
  //   @Param('id') id: number,
  //   @Param('orderId') orderId: number,
  // ): Promise<void> {
  //   return this.ordersService.makeDefault(id, orderId);
  // }
}
