import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
export class PurchaseCoinDto {
  @ApiProperty({ description: 'store production id' })
  @IsOptional()
  @IsString()
  id: string;

  @ApiProperty({ description: '# of coins' })
  @IsNumber()
  coins: number;
}
