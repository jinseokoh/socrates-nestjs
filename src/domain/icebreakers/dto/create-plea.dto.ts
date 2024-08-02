import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
export class CreatePleaDto {
  @ApiProperty({ description: 'userId' })
  @IsNumber()
  @IsOptional()
  userId: number;

  @ApiProperty({ description: 'recipientId' })
  @IsNumber()
  @IsOptional()
  recipientId: number;

  @ApiProperty({ description: 'feedId' })
  @IsNumber()
  @IsOptional()
  feedId: number;

  @ApiProperty({ description: '요청시 사례 비용' })
  @IsNumber()
  reward: number;

  @ApiProperty({ description: '요청시 보내는 글; optional' })
  @IsString()
  @IsOptional()
  message?: string;
}
