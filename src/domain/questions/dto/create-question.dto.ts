import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateQuestionDto {
  @ApiProperty({ description: '작품명 🔍' })
  @IsOptional()
  @IsString()
  title: string | null;

  @ApiProperty({ description: '작가명 🔍' })
  @IsOptional()
  @IsString()
  name: string | null;

  @ApiProperty({ description: '본문 🔍' })
  @IsNotEmpty()
  @IsString()
  body?: string | null;

  @ApiProperty({ description: '답변' })
  @IsOptional()
  @IsString()
  answer?: string | null;

  @ApiProperty({ description: '사용자 아이디' })
  @IsNumber()
  @IsOptional()
  userId: number | null;

  @ApiProperty({ description: '이미지들 (String[])', required: false })
  @IsArray()
  @IsOptional()
  images?: string[] | null;
}
