import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateConnectionDto {
  @ApiProperty({ description: 'dot 답변' })
  @IsArray()
  @IsOptional()
  choices: number[] | null;

  @ApiProperty({ description: 'dot 답변' })
  @IsString()
  answer: string;

  @ApiProperty({ description: '이미지들 (string[])', required: false })
  @IsArray()
  @IsOptional()
  images: string[] | null;

  @ApiProperty({ description: 'count' })
  @IsNumber()
  @IsOptional()
  remarkCount: number | null;

  @ApiProperty({ description: 'count' })
  @IsNumber()
  @IsOptional()
  reportCount: number | null;

  @ApiProperty({ description: 'count' })
  @IsNumber()
  @IsOptional()
  sympathyCount: number | null;

  @ApiProperty({ description: 'count' })
  @IsNumber()
  @IsOptional()
  smileCount: number | null;

  @ApiProperty({ description: 'count' })
  @IsNumber()
  @IsOptional()
  surpriseCount: number | null;

  @ApiProperty({ description: 'count' })
  @IsNumber()
  @IsOptional()
  sorryCount: number | null;

  @ApiProperty({ description: 'count' })
  @IsNumber()
  @IsOptional()
  uneasyCount: number | null;

  @ApiProperty({ description: 'dot 아이디', required: true })
  @IsNumber()
  dotId: number;

  @ApiProperty({ description: 'user 아이디', required: true })
  @IsNumber()
  userId: number;
}
