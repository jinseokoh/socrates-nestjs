import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { InquiryType } from 'src/common/enums/inquiry-type';

export class CreateInquiryDto {
  @ApiProperty({
    description: '질문유형',
    default: InquiryType.GENERAL,
  })
  @IsEnum(InquiryType)
  @IsOptional()
  inquiryType?: InquiryType = InquiryType.GENERAL;

  @ApiProperty({ description: '질문' })
  @IsOptional()
  @IsString()
  title?: string | null;

  @ApiProperty({ description: '답변' })
  @IsOptional()
  @IsString()
  body?: string | null;

  @ApiProperty({ description: '이미지들 (string[])', required: true })
  @IsArray()
  images: string[];

  @ApiProperty({ description: '사용자 아이디' })
  @IsNumber()
  @IsOptional()
  userId: number | null;
}
