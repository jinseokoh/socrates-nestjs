import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
export class ShippingCostDto {
  @ApiProperty({
    description: '배달비 소계',
    default: 0,
  })
  @IsNumber()
  shippingSubtotal: number;

  @ApiProperty({
    description: '배달 할인 금액',
    default: 0,
  })
  @IsNumber()
  shippingDiscount: number;
}
