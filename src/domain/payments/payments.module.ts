import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArtworksModule } from 'src/domain/artworks/artworks.module';
import { Grant } from 'src/domain/grants/grant.entity';
import { GrantsModule } from 'src/domain/grants/grants.module';
import { Order } from 'src/domain/orders/order.entity';
import { OrdersModule } from 'src/domain/orders/orders.module';
import { Payment } from 'src/domain/payments/payment.entity';
import { PaymentsIamportController } from 'src/domain/payments/payments-iamport.controller';
import { PaymentsController } from 'src/domain/payments/payments.controller';
import { PaymentsService } from 'src/domain/payments/payments.service';
import { User } from 'src/domain/users/user.entity';
import { UsersModule } from 'src/domain/users/users.module';
import { FcmModule } from 'src/services/fcm/fcm.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, User, Order, Grant]),
    FcmModule,
    OrdersModule,
    GrantsModule,
    UsersModule,
    ArtworksModule,
  ],
  providers: [PaymentsService],
  controllers: [PaymentsController, PaymentsIamportController],
})
export class PaymentsModule {}
