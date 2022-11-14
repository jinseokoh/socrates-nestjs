import { IntersectionType } from '@nestjs/mapped-types';
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
  @ApiProperty({ description: '제목' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: '부제목' })
  @IsNotEmpty()
  @IsString()
  subtitle: string;

  @ApiProperty({ description: '본문' })
  @IsNotEmpty()
  @IsString()
  body?: string | null;

  @ApiProperty({ description: '이미지들 (String[])', required: false })
  @IsArray()
  @IsOptional()
  images?: string[] | null;

  @ApiProperty({
    description: '아티클분류',
    default: ArticleCategory.FLEA_AUCTION,
  })
  @IsEnum(ArticleCategory)
  @IsOptional()
  category?: ArticleCategory;

  @ApiProperty({ description: '출판여부', default: false })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}

export class ArticleAuctionsDto {
  @ApiProperty({
    description: '아티클에 연결된 옥션 아이디들',
    required: true,
  })
  @IsArray()
  @IsOptional()
  auctionIds?: number[];
}

export class ArticleArticlesDto {
  @ApiProperty({
    description: '아티클에 연결된 아티클 아이디들',
    required: true,
  })
  @IsArray()
  @IsOptional()
  articleIds?: number[];
}
export class CreateArticleDtoWithArticeAuctionsDto extends IntersectionType(
  CreateArticleDto,
  ArticleAuctionsDto,
) {}

export class CreateArticleDtoWithArticeArticlesDto extends IntersectionType(
  CreateArticleDto,
  ArticleArticlesDto,
) {}

export class CreateArticleDtoWithArticeAuctionsDtoArticleArticlesDto extends IntersectionType(
  CreateArticleDto,
  ArticleAuctionsDto,
  ArticleArticlesDto,
) {}
