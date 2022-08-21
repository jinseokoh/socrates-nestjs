import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Auction } from 'src/domain/auctions/auction.entity';
import { Order } from 'src/domain/orders/order.entity';
import { OrdersController } from 'src/domain/orders/orders.controller';
import { OrdersService } from 'src/domain/orders/orders.service';
@Module({
  imports: [TypeOrmModule.forFeature([Order, Auction])],
  exports: [OrdersService],
  providers: [OrdersService],
  controllers: [OrdersController],
})
export class OrdersModule {}
