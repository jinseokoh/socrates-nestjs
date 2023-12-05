import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateConnectionDto {
  @ApiProperty({ description: 'dot 아이디' })
  @IsNumber()
  @IsOptional()
  dotId: number;

  @ApiProperty({ description: 'user 아이디' })
  @IsNumber()
  @IsOptional()
  userId: number;

  @ApiProperty({ description: 'dot 답변' })
  @IsString()
  body: string;

  @ApiProperty({ description: 'user 아이디' })
  @IsNumber()
  @IsOptional()
  likes: number | null;

  @ApiProperty({ description: 'user 아이디' })
  @IsNumber()
  @IsOptional()
  dislikes: number | null;

  @ApiProperty({ description: 'user 아이디' })
  @IsNumber()
  @IsOptional()
  nsfws: number | null;
}
