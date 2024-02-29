import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
export class CreatePleaDto {
  @ApiProperty({ description: 'senderId' })
  @IsNumber()
  @IsOptional()
  senderId: number;

  @ApiProperty({ description: 'recipientId' })
  @IsNumber()
  @IsOptional()
  recipientId: number;

  @ApiProperty({ description: 'dotId' })
  @IsNumber()
  @IsOptional()
  dotId: number;

  @ApiProperty({ description: '요청시 사례 비용' })
  @IsNumber()
  reward: number;

  @ApiProperty({ description: '요청시 보내는 글; optional' })
  @IsString()
  @IsOptional()
  message?: string;
}
