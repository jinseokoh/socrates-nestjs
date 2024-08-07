import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateInquiryCommentDto {
  @ApiProperty({ description: '댓글 🔍' })
  @IsString()
  body: string;

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

  @ApiProperty({ description: '사용자 아이디' })
  @IsNumber()
  @IsOptional()
  userId: number;

  @ApiProperty({ description: 'inquiry 아이디' })
  @IsNumber()
  @IsOptional()
  inquiryId: number;

  @ApiProperty({ description: 'inquiry comment 아이디' })
  @IsNumber()
  @IsOptional()
  commentId: number | null;

  @ApiProperty({ description: '상위 댓글 아이디', required: false })
  @IsNumber()
  @IsOptional()
  parentId?: number | null;

  @ApiProperty({ description: 'whether or not sending notification' })
  @IsBoolean()
  @IsOptional()
  sendNotification?: boolean;
}
