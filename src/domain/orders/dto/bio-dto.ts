import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';
export class BioDto {
  @ApiProperty({ description: 'deprecated' })
  @IsString()
  date: string; // YYYY-MM-DD

  @ApiProperty({ description: 'deprecated' })
  @IsString()
  time: string; // HH:mm

  @ApiProperty({ description: 'deprecated' })
  @IsString()
  gender: string;

  @ApiProperty({ description: 'deprecated' })
  @IsNumber()
  year: number;
}
