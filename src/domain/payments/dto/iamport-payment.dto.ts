import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
export class IamportPaymentDto {
  @ApiProperty({ description: '아임포트결제번호' })
  @IsString()
  imp_uid: string;

  @ApiProperty({ description: 'FA결제번호; `payment_${id}` Payment Id' })
  @IsString()
  merchant_uid: string;
}
export class IamportWebhookDto {
  @ApiProperty({ description: '아임포트결제번호' })
  @IsString()
  imp_uid: string;

  @ApiProperty({ description: 'FA결제번호; `payment_${id}` Payment Id' })
  @IsString()
  merchant_uid: string;

  @ApiProperty({ description: '결제상태' })
  @IsString()
  status: string;
}
