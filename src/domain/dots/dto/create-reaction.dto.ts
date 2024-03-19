import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class CreateReactionDto {
  @ApiProperty({ description: 'sympathy' })
  @IsBoolean()
  @IsOptional()
  sympathy: boolean;

  @ApiProperty({ description: 'smile' })
  @IsBoolean()
  @IsOptional()
  smile: boolean;

  @ApiProperty({ description: 'surprise' })
  @IsBoolean()
  @IsOptional()
  surprise: boolean;

  @ApiProperty({ description: 'sorry' })
  @IsBoolean()
  @IsOptional()
  sorry: boolean;

  @ApiProperty({ description: 'uneasy' })
  @IsBoolean()
  @IsOptional()
  uneasy: boolean;

  @ApiProperty({ description: '사용자 아이디' })
  @IsNumber()
  @IsOptional()
  userId: number;

  @ApiProperty({ description: '관련 Connection 아이디' })
  @IsNumber()
  @IsOptional()
  connectionId: number;
}
