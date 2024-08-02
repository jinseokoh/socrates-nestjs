import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateContentCommentDto {
  @ApiProperty({ description: '사용자 아이디' })
  @IsNumber()
  @IsOptional()
  userId: number;

  @ApiProperty({ description: '관련 Content 아이디' })
  @IsNumber()
  @IsOptional()
  contentId: number;

  @ApiProperty({ description: '상위 댓글 아이디', required: false })
  @IsNumber()
  @IsOptional()
  parentId?: number | null;

  @ApiProperty({ description: '질문' })
  @IsString()
  @IsOptional()
  title?: string | null;

  @ApiProperty({ description: '댓글 🔍' })
  @IsString()
  body: string;

  @ApiProperty({ description: '이미지들 (string[])', required: true })
  @IsArray()
  @IsOptional()
  images: string[];

  @ApiProperty({ description: 'like count' })
  @IsNumber()
  @IsOptional()
  likeCount: number | null;

  @ApiProperty({ description: 'flag count' })
  @IsNumber()
  @IsOptional()
  flagCount: number | null;

  @ApiProperty({ description: '종료시각' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  expiredAt: Date | null;

  @ApiProperty({ description: 'whether or not sending notification' })
  @IsBoolean()
  @IsOptional()
  sendNotification?: boolean;
}
