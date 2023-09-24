import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAnswerDto {
  @ApiProperty({ description: '댓글 🔍' })
  @IsString()
  body: string;

  @ApiProperty({ description: 'userId 아이디' })
  @IsNumber()
  @IsOptional()
  userId: number | null;

  @ApiProperty({ description: 'meetupId 아이디' })
  @IsNumber()
  @IsOptional()
  meetupId: number | null;

  @ApiProperty({ description: 'questionId 아이디' })
  @IsNumber()
  @IsOptional()
  questionId: number | null;

  @ApiProperty({ description: 'answerId 아이디' })
  @IsNumber()
  @IsOptional()
  answerId: number | null;

  @ApiProperty({ description: '상위 댓글 아이디', required: false })
  @IsNumber()
  @IsOptional()
  parentId?: number | null;
}
