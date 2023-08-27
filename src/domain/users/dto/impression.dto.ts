import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
export class ImpressionDto {
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
}
