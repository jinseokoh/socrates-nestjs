import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
export class CreateImpressionDto {
  @ApiProperty({ description: 'appropriateness', default: 0 })
  @IsNumber()
  appropriateness: number;

  @ApiProperty({ description: 'attitude', default: 0 })
  @IsNumber()
  attitude: number;

  @ApiProperty({ description: 'empathy', default: 0 })
  @IsNumber()
  empathy: number;

  @ApiProperty({ description: 'humor', default: 0 })
  @IsNumber()
  humor: number;

  @ApiProperty({ description: 'manner', default: 0 })
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
