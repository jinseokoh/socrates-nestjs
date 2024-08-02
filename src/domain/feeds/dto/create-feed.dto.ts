import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { Poll } from 'src/domain/icebreakers/entities/poll.entity';

export class CreateFeedDto {
  @ApiProperty({ description: 'slug' })
  @IsString()
  slug: string;

  @ApiProperty({ description: 'title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'body' })
  @IsString()
  body: string;

  @ApiProperty({ description: '이미지들 (string[])' })
  @IsArray()
  @IsOptional()
  images: string[] | null;

  @ApiProperty({ description: 'body', default: false })
  @IsBoolean()
  isAnonymous: boolean;

  @ApiProperty({ description: 'view count' })
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

  @ApiProperty({ description: 'bookmark count' })
  @IsNumber()
  @IsOptional()
  bookmarkCount: number | null;

  @ApiProperty({ description: 'flag count' })
  @IsNumber()
  @IsOptional()
  flagCount: number | null;

  @ApiProperty({ description: 'user 아이디' })
  @IsNumber()
  @IsOptional()
  userId: number;

  @ApiProperty({ description: 'user 아이디' })
  @IsObject()
  @IsOptional()
  poll: Omit<Poll, 'id'>;
}
