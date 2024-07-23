import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
export class CreateImpressionDto {
  @ApiProperty({ description: 'appearance', required: false, default: 0 })
  @IsNumber()
  appearance: number;

  @ApiProperty({ description: 'knowledge', required: false, default: 0 })
  @IsNumber()
  knowledge: number;

  @ApiProperty({ description: 'confidence', required: false, default: 0 })
  @IsNumber()
  confidence: number;

  @ApiProperty({ description: 'humor', required: false, default: 0 })
  @IsNumber()
  humor: number;

  @ApiProperty({ description: 'manner', required: false })
  @IsNumber()
  manner: number;

  @ApiProperty({ description: 'meetup 정보', required: false })
  @IsString()
  @IsOptional()
  note: string | null;

  @ApiProperty({ description: '평가대상 사용자 아이디', required: false })
  @IsNumber()
  @IsOptional()
  userId: number | null;

  @ApiProperty({ description: '평가하는 사용자 아이디', required: false })
  @IsNumber()
  @IsOptional()
  recipientId: number;
}
