import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateQuestionDto {
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
}
