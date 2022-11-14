import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsJSON,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaymentMethod, PaymentStatus } from 'src/common/enums';
export class CreatePaymentDto {
  @ApiProperty({ description: '구매 작품', required: false })
  @IsString()
  @IsOptional()
  title: string | null;

  @ApiProperty({
    description: '상품아이템 가격 합계 (A)',
    default: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  priceSubtotal?: number | null;

  @ApiProperty({
    description: '상품아이템 배달비 합계 (B)',
    default: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  shippingSubtotal?: number | null;

  @ApiProperty({
    description: '배달비 디스카운트',
    default: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  shippingDiscount?: number | null;

  @ApiProperty({
    description: '쿠폰 디스카운트',
    default: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  couponDiscount?: number | null;

  @ApiProperty({
    description: '주문 최종결제금',
    default: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  grandTotal?: number | null;

  @ApiProperty({ description: 'PG사 아이디', required: false })
  @IsString()
  @IsOptional()
  pgId?: string | null;

  @ApiProperty({
    description: '결제방법',
    default: PaymentMethod.card,
    required: false,
  })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiProperty({
    description: '결제상태',
    default: PaymentStatus.ready,
    required: false,
  })
  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;

  @ApiProperty({
    description: '가상계좌정보',
    required: false,
  })
  @IsString()
  @IsOptional()
  paymentInfo?: string | null;

  @ApiProperty({ description: 'raw payload', required: false })
  @Type(() => JSON.parse)
  @IsJSON()
  @IsOptional()
  payload?: object | null;

  @ApiProperty({ description: '결제시각 (ISO8601)', required: false })
  @Type(() => Date)
  @IsOptional()
  paidAt?: string | null;

  @ApiProperty({ description: '취소시각 (ISO8601)', required: false })
  @Type(() => Date)
  @IsOptional()
  canceledAt?: string | null;

  @ApiProperty({ description: '사용자 아이디', required: false })
  @IsNumber()
  @IsOptional()
  userId: number | null;

  @ApiProperty({ description: '배송지 아이디', required: false })
  @IsNumber()
  @IsOptional()
  destinationId: number | null;

  @ApiProperty({ description: 'Grant 아이디', required: false })
  @IsNumber()
  @IsOptional()
  grantId: number | null;

  @ApiProperty({
    description: '오더 아이템 아이디들',
    type: 'number',
    isArray: true,
  })
  @Type(() => Number)
  @IsArray()
  orderIds: number[] | null;
}
