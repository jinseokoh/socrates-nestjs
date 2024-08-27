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

export class CreateIcebreakerAnswerDto {
  @ApiProperty({ description: '질문내용' })
  @IsString()
  body: string;

  @ApiProperty({ description: '이미지들 (string[])' })
  @IsArray()
  @IsOptional()
  images: string[] | null;

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

  @ApiProperty({ description: 'icebreaker 아이디' })
  @IsNumber()
  @IsOptional()
  icebreakerId: number | null;

  @ApiProperty({ description: 'icebreaker answer 아이디' })
  @IsNumber()
  @IsOptional()
  answerId: number | null;

  @ApiProperty({ description: '상위 댓글 아이디', required: false })
  @IsNumber()
  @IsOptional()
  parentId?: number | null;

  @ApiProperty({ description: 'whether or not sending notification' })
  @IsBoolean()
  @IsOptional()
  sendNotification?: boolean;
}
