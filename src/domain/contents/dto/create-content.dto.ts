import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
export class CreateContentDto {
  @ApiProperty({ description: 'slug' })
  @IsString()
  slug: string;

  @ApiProperty({ description: '제목' })
  @IsString()
  title: string;

  @ApiProperty({ description: '본문', required: false })
  @IsString()
  @IsOptional()
  body?: string | null;

  @ApiProperty({ description: '이미지', required: false })
  @IsArray()
  @IsOptional()
  images: string[] | null;

  @ApiProperty({ description: 'comment count' })
  @IsNumber()
  @IsOptional()
  viewCount: number | null;

  @ApiProperty({ description: 'comment count' })
  @IsNumber()
  @IsOptional()
  commentCount: number | null;

  @ApiProperty({ description: 'like count' })
  @IsNumber()
  @IsOptional()
  likeCount: number | null;
}
