import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateInquiryDto {
  @ApiProperty({ description: '사용자 아이디' })
  @IsNumber()
  @IsOptional()
  userId: number | null;

  @ApiProperty({ description: 'entity type', required: false })
  @IsString()
  @IsOptional()
  entityType?: string;

  @ApiProperty({ description: 'entity id', required: false })
  @IsNumber()
  @IsOptional()
  entityId?: number;

  @ApiProperty({ description: '질문' })
  @IsString()
  @IsOptional()
  title?: string | null;

  @ApiProperty({ description: '답변' })
  @IsString()
  @IsOptional()
  body?: string | null;

  @ApiProperty({ description: '이미지들 (string[])', required: true })
  @IsArray()
  @IsOptional()
  images: string[];

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
