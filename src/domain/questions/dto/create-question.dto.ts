import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateQuestionDto {
  @ApiProperty({ description: '문의하는 회원의 셀러타입' })
  @IsOptional()
  @IsString()
  sellerType: string | null;

  @ApiProperty({ description: '질문' })
  @IsOptional()
  @IsString()
  question?: string | null;

  @ApiProperty({ description: '답변' })
  @IsOptional()
  @IsString()
  answer?: string | null;

  @ApiProperty({ description: '사용자 아이디' })
  @IsNumber()
  @IsOptional()
  userId: number | null;

  @ApiProperty({ description: '작품 아이디' })
  @IsNumber()
  @IsOptional()
  artworkId: number | null;
}
