import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateFeedDto {
  @ApiProperty({ description: 'slug' })
  @IsString()
  slug: string;

  @ApiProperty({ description: 'body' })
  @IsString()
  body: string;

  @ApiProperty({ description: '이미지들 (string[])' })
  @IsArray()
  @IsOptional()
  images: string[] | null;

  @ApiProperty({ description: 'view count' })
  @IsNumber()
  @IsOptional()
  viewCount: number | null;

  @ApiProperty({ description: 'like count' })
  @IsNumber()
  @IsOptional()
  likeCount: number | null;

  @ApiProperty({ description: 'bookmark count' })
  @IsNumber()
  @IsOptional()
  bookmarkCount: number | null;

  @ApiProperty({ description: 'comment count' })
  @IsNumber()
  @IsOptional()
  commentCount: number | null;

  @ApiProperty({ description: 'report count' })
  @IsNumber()
  @IsOptional()
  reportCount: number | null;

  @ApiProperty({ description: 'linkedFeedIds' })
  @IsArray()
  @IsOptional()
  linkedFeedIds: number[];

  @ApiProperty({ description: 'user 아이디' })
  @IsNumber()
  @IsOptional()
  userId: number;
}
