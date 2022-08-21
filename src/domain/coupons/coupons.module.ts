import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponsController } from 'src/domain/coupons/coupons.controller';
import { CouponsService } from 'src/domain/coupons/coupons.service';
import { User } from '../users/user.entity';
import { Coupon } from './coupon.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Coupon, User])],
  exports: [CouponsService],
  providers: [CouponsService],
  controllers: [CouponsController],
})
export class CouponsModule {}
