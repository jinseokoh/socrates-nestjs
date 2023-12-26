import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional } from 'class-validator';
export class GetReactionsDto {
  @ApiProperty({ description: 'id들 (number[])', required: true })
  @IsArray()
  connectionIds: number[];

  @ApiProperty({ description: '사용자 아이디', required: false })
  @IsNumber()
  @IsOptional()
  userId?: number | null;
}
