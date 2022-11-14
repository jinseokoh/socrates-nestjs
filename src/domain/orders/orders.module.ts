import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Auction } from 'src/domain/auctions/auction.entity';
import { Destination } from 'src/domain/destinations/destination.entity';
import { Order } from 'src/domain/orders/order.entity';
import { OrdersController } from 'src/domain/orders/orders.controller';
import { OrdersService } from 'src/domain/orders/orders.service';
import { Payment } from 'src/domain/payments/payment.entity';
import { UserOrdersController } from 'src/domain/users/user-orders.controller';
import { User } from 'src/domain/users/user.entity';
import { ShippingModule } from '../../services/shipping/shipping.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Order, Payment, Auction, Destination]),
    ShippingModule,
  ],
  exports: [OrdersService],
  providers: [OrdersService],
  controllers: [OrdersController, UserOrdersController],
})
export class OrdersModule {}
