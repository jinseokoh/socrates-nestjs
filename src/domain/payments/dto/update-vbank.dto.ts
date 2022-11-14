import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
export class UpdateVbankDto {
  @ApiProperty({ description: '가상계좌정보 from Iamport' })
  @IsString()
  paymentInfo: string;
}
