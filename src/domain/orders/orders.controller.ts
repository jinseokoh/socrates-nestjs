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
import { TrackResult } from 'src/common/types/track-result.type';
import { BioDto } from 'src/domain/orders/dto/bio-dto';
import { BuyItNowDto } from 'src/domain/orders/dto/buy-it-now.dto';
import { UpdateOrderDto } from 'src/domain/orders/dto/update-order.dto';
import { Order } from 'src/domain/orders/order.entity';
import { OrdersService } from 'src/domain/orders/orders.service';
import { ShippingService } from 'src/services/shipping/shipping.service';
@UseInterceptors(ClassSerializerInterceptor)
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly transportService: ShippingService,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Order 생성' })
  @Post()
  async create(@Body('auctionId') auctionId: number): Promise<Order> {
    return await this.ordersService.create(auctionId);
  }

  @ApiOperation({ description: 'BuyItNow' })
  @Post('now')
  async buyItNow(
    @CurrentUserId() userId: number,
    @Body() dto: BuyItNowDto,
  ): Promise<Order> {
    return await this.ordersService.buyItNow(userId, dto);
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @ApiOperation({
    description: 'Order 리스트 w/ Pagination',
  })
  @PaginateQueryOptions()
  @Get()
  async getOrders(
    @CurrentUserId() userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Order>> {
    return this.ordersService.findAll(query);
  }

  // todo. this is FCM push message
  // since we can fetch the same list w/ filter.userId query param
  // no reason to make another method here. in case you wonder why
  // i commented this out.
  //
  // @ApiOperation({
  //   description: '나의 Order 리스트 w/ Pagination',
  // })
  // @PaginateQueryOptions()
  // @Get('me')
  // async getOrders(
  //   @CurrentUserId() userId: number,
  //   @Paginate() query: PaginateQuery,
  // ): Promise<Paginated<Order>> {
  //   return this.ordersService.findAllByUserId(userId, query);
  // }

  @ApiOperation({ description: '주문 상세보기' })
  @Get(':id')
  async getOrderById(@Param('id') id: number): Promise<Order> {
    return await this.ordersService.findById(id, [
      'user',
      'auction',
      'auction.artwork',
      'auction.artwork.artist',
      'payment',
      'payment.grant',
      'payment.grant.coupon',
      'payment.destination',
      'payment.orders',
    ]);
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '주문 수정' })
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() dto: UpdateOrderDto,
  ): Promise<Order> {
    console.log(dto);
    return await this.ordersService.update(id, dto);
  }

  @ApiOperation({ description: '결제후 주문 보정' })
  @Patch(':id/payment')
  async updateAfterPayment(@Param('id') id: number): Promise<void> {
    const order = await this.ordersService.findById(id, ['payment']);

    return await this.ordersService.updateAfterPayment(order.payment.id);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '주문 soft 삭제' })
  @Delete('now')
  async removeAll(@Body('orderId') orderId: number): Promise<Order> {
    return await this.ordersService.removeAll(orderId);
  }

  @ApiOperation({ description: '주문 soft 삭제' })
  @Delete(':id')
  async remove(@Param('id') id: number): Promise<Order> {
    return await this.ordersService.remove(id);
  }

  //--------------------------------------------------------------------------//
  // Some extra shit
  //--------------------------------------------------------------------------//

  @ApiOperation({
    description: '송장조회',
  })
  @Get(':id/track')
  async track(@Param('id') id: number): Promise<TrackResult> {
    return await this.ordersService.track(id);
  }

  @ApiOperation({
    description: 'debug',
  })
  @Get(':id/debug')
  async check(@Body() dto: BioDto): Promise<any> {
    return await this.ordersService.checkBio(dto);
  }
}
