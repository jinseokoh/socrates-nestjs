import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateThreadDto {
  @ApiProperty({ description: '질문내용' })
  @IsString()
  body: string;

  @ApiProperty({ description: '사용자 아이디' })
  @IsNumber()
  @IsOptional()
  userId: number | null;

  @ApiProperty({ description: 'meetup 아이디' })
  @IsNumber()
  @IsOptional()
  meetupId: number | null;

  // @ApiProperty({ description: 'thread 아이디' })
  // @IsNumber()
  // @IsOptional()
  // threadId: number | null;

  @ApiProperty({ description: '상위 댓글 아이디', required: false })
  @IsNumber()
  @IsOptional()
  parentId?: number | null;
}
