import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { OrderType } from 'src/common/enums/order-type';
export class CreateOrderDto {
  @ApiProperty({ description: '상품아이템 제목', required: false })
  @IsString()
  @IsOptional()
  title: string | null;

  @ApiProperty({ description: '상품아이템 이미지', required: false })
  @IsString()
  @IsOptional()
  image?: string | null;

  @ApiProperty({
    description: '상품아이템 타입',
    default: OrderType.AUCTION,
    required: false,
  })
  @IsEnum(OrderType)
  @IsOptional()
  orderType: OrderType;

  @ApiProperty({ description: '상품아이템 SKU', required: false })
  @IsString()
  @IsOptional()
  sku?: string | null;

  @ApiProperty({ description: '상품아이템 가격', required: false })
  @IsNumber()
  @IsOptional()
  price?: number | null;

  @ApiProperty({ description: '상품아이템 배달비', required: false })
  @IsNumber()
  @IsOptional()
  deliveryFee?: number | null;

  @ApiProperty({ description: '상품아이템 수량', required: false })
  @IsNumber()
  @IsOptional()
  quantity: number;

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
