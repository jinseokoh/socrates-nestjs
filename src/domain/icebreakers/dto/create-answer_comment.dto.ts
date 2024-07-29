import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAnswerCommentDto {
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

  @ApiProperty({ description: '관련 Answer 아이디' })
  @IsNumber()
  @IsOptional()
  answerId: number;

  @ApiProperty({ description: '상위 댓글 아이디', required: false })
  @IsNumber()
  @IsOptional()
  parentId?: number | null;
}
