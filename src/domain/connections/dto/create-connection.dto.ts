import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateConnectionDto {
  @ApiProperty({ description: 'dot 답변' })
  @IsString()
  answer: string;

  @ApiProperty({ description: 'dot 아이디' })
  @IsNumber()
  @IsOptional()
  dotId: number;

  @ApiProperty({ description: 'user 아이디' })
  @IsNumber()
  @IsOptional()
  userId: number;

  @ApiProperty({ description: 'count' })
  @IsNumber()
  @IsOptional()
  reportCount: number | null;

  @ApiProperty({ description: 'count' })
  @IsNumber()
  @IsOptional()
  sympatheticCount: number | null;

  @ApiProperty({ description: 'count' })
  @IsNumber()
  @IsOptional()
  humorousCount: number | null;

  @ApiProperty({ description: 'count' })
  @IsNumber()
  @IsOptional()
  surprisedCount: number | null;

  @ApiProperty({ description: 'count' })
  @IsNumber()
  @IsOptional()
  sadCount: number | null;

  @ApiProperty({ description: 'count' })
  @IsNumber()
  @IsOptional()
  disgustCount: number | null;
}
