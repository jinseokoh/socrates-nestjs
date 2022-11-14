import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
export class CreateGameDto {
  @ApiProperty({ description: '호가' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: '옥션 아이디' })
  @IsNumber()
  @IsOptional()
  auctionId: number | null;

  @ApiProperty({ description: '사용자 아이디' })
  @IsNumber()
  @IsOptional()
  userId: number | null;

  @ApiProperty({ description: '미공개 메모', required: false })
  @IsString()
  @IsOptional()
  note?: string | null;
}
