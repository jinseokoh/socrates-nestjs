import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ description: '제목 🔍' })
  @IsOptional()
  @IsString()
  title: string | null;

  @ApiProperty({ description: '본문 🔍' })
  @IsNotEmpty()
  @IsString()
  body?: string | null;

  @ApiProperty({ description: '사용자 아이디' })
  @IsNumber()
  @IsOptional()
  userId: number | null;

  @ApiProperty({ description: '옥션 아이디', required: true })
  @IsNumber()
  auctionId: number;

  @ApiProperty({ description: '이미지들 (String[])', required: false })
  @IsArray()
  @IsOptional()
  images?: string[] | null;

  @ApiProperty({ description: '출판여부 💡', default: false })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}
