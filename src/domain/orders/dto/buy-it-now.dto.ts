import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
export class BuyItNowDto {
  @ApiProperty({ description: '옥션 아이디' })
  @IsNumber()
  auctionId: number | null;
}
