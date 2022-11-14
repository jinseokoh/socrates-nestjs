import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Courier } from 'src/common/enums/courier';
import { OrderStatus } from 'src/common/enums/order-status';
import { OrderType } from 'src/common/enums/order-type';
import { ShippingStatus } from 'src/common/enums/shipping-status';
export class CreateOrderDto {
  @ApiProperty({ description: '상품아이템 제목', required: false })
  @IsString()
  @IsOptional()
  title: string | null;

  @ApiProperty({ description: '상품아이템 이미지', required: false })
  @IsString()
  @IsOptional()
  image?: string | null;

  @ApiProperty({ description: '상품아이템 타입', default: OrderType.AUCTION })
  @IsEnum(OrderType)
  orderType: OrderType;

  @ApiProperty({ description: '상품아이템 타입', default: OrderStatus.WAITING })
  @IsEnum(OrderStatus)
  orderStatus: OrderStatus;

  @ApiProperty({ description: '상품아이템 가격', required: false })
  @IsNumber()
  @IsOptional()
  price?: number | null;

  @ApiProperty({ description: '상품아이템 배달비', required: false })
  @IsNumber()
  @IsOptional()
  shipping?: number | null;

  @ApiProperty({ description: '택배업체', default: Courier.KDEXP })
  @IsEnum(Courier)
  courier: Courier;

  @ApiProperty({ description: '송장번호', required: false })
  @IsString()
  @IsOptional()
  trackingNumber?: string | null;

  @ApiProperty({ description: '배송설명(특이사항)', required: false })
  @IsString()
  @IsOptional()
  shippingComment?: string | null;

  @ApiProperty({ description: '배송상태', default: ShippingStatus.PACKAGING })
  @IsEnum(ShippingStatus)
  shippingStatus: ShippingStatus;

  @ApiProperty({ description: '사용자 아이디', required: false })
  @IsNumber()
  @IsOptional()
  userId: number | null;

  @ApiProperty({ description: '옥션 아이디' })
  @IsNumber()
  @IsOptional()
  auctionId: number | null;

  @ApiProperty({ description: '주문 아이디', required: false })
  @IsNumber()
  @IsOptional()
  paymentId: number | null;
}
