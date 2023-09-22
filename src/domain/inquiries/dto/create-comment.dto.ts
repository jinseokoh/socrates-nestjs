import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ description: '댓글 🔍' })
  @IsString()
  body: string;

  @ApiProperty({ description: '사용자 아이디' })
  @IsNumber()
  @IsOptional()
  userId: number | null;

  @ApiProperty({ description: '관련 질문 아이디' })
  @IsNumber()
  @IsOptional()
  questionId: number | null;

  @ApiProperty({ description: '상위 댓글 아이디', required: false })
  @IsNumber()
  @IsOptional()
  parentId?: number | null;
}
