import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';
export class CreateCouponDto {
  @ApiProperty({ description: '이름 🔍' })
  @IsString()
  name: string;

  @ApiProperty({ description: '코드' })
  @IsString()
  code: string;

  @ApiProperty({ description: '할인금액' })
  @IsNumber()
  discount: number;

  @ApiProperty({ description: '최대발급갯수' })
  @IsNumber()
  @IsOptional()
  total?: number | null;

  @ApiProperty({ description: '만기시각', required: false })
  @Type(() => Date)
  @IsOptional()
  expiredAt?: string | null;
}
