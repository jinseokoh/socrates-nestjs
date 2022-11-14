import { Module } from '@nestjs/common';
import { ShippingService } from 'src/services/shipping/shipping.service';

@Module({
  providers: [ShippingService],
  exports: [ShippingService],
})
export class ShippingModule {}
