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
import { Order } from 'src/domain/orders/order.entity';
import { OrdersService } from 'src/domain/orders/orders.service';
import { UpdatePaymentDto } from 'src/domain/payments/dto/update-payment.dto';
@UseInterceptors(ClassSerializerInterceptor)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiOperation({ description: '주문 생성' })
  @Post()
  async create(@Body('auctionId') auctionId: number): Promise<Order> {
    return await this.ordersService.create(auctionId);
  }

  @ApiOperation({
    description: '내가 결제해야할 주문아이템 리스트 w/ Pagination',
  })
  @PaginateQueryOptions()
  @Get()
  async getOrders(
    @CurrentUserId() userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Order>> {
    return this.ordersService.findAll(userId, query);
  }

  @ApiOperation({ description: '주문 상세보기' })
  @Get(':id')
  async getOrderById(@Param('id') id: number): Promise<Order> {
    return await this.ordersService.findById(id, ['user', 'auction']);
  }

  @ApiOperation({ description: '주문 수정' })
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() dto: UpdatePaymentDto,
  ): Promise<Order> {
    return await this.ordersService.update(id, dto);
  }

  @ApiOperation({ description: '주문 soft 삭제' })
  @Delete(':id')
  async remove(@Param('id') id: number): Promise<Order> {
    return await this.ordersService.softRemove(id);
  }
}
