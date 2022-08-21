import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ArticleCategory } from 'src/common/enums';
export class CreateArticleDto {
  @ApiProperty({ description: '제목 🔍' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: '부제목 🔍' })
  @IsNotEmpty()
  @IsString()
  subtitle: string;

  @ApiProperty({ description: '본문 🔍' })
  @IsNotEmpty()
  @IsString()
  body?: string | null;

  @ApiProperty({ description: '이미지들 (String[])', required: false })
  @IsArray()
  @IsOptional()
  images?: string[] | null;

  @ApiProperty({
    description: '아티클분류 💡',
    default: ArticleCategory.CONTENT,
  })
  @IsEnum(ArticleCategory)
  @IsOptional()
  category?: ArticleCategory;

  @ApiProperty({ description: '출판여부 💡', default: false })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}
