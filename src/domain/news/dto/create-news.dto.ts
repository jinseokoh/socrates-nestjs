import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { NewsCategory } from 'src/common/enums/news-category';
export class CreateNewsDto {
  @ApiProperty({ description: '제목 🔍' })
  @IsString()
  title: string;

  @ApiProperty({ description: '본문 🔍' })
  @IsString()
  @IsOptional()
  body?: string | null;

  @ApiProperty({ description: '이미지들 (String[])', required: false })
  @IsArray()
  @IsOptional()
  images?: object[] | null;

  @ApiProperty({
    description: '공지사항 분류 💡',
    default: NewsCategory.GENERAL,
  })
  @IsEnum(NewsCategory)
  @IsOptional()
  category?: NewsCategory;

  @ApiProperty({ description: '고정여부 💡', required: false, default: false })
  @IsBoolean()
  @IsOptional()
  isFixed?: boolean;

  @ApiProperty({ description: '출판여부 💡', required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}
