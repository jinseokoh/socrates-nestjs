import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { InquiryType } from 'src/common/enums/inquiry-type';
import { ITargetEntity } from 'src/domain/inquiries/entities/target-entity.interface';

export class CreateInquiryDto {
  @ApiProperty({ description: 'TargetEntity', required: false })
  @IsObject()
  @IsOptional()
  targetEntity?: ITargetEntity;

  @ApiProperty({
    description: '질문유형',
    default: InquiryType.OTHER,
  })
  @IsEnum(InquiryType)
  inquiryType?: InquiryType = InquiryType.OTHER;

  @ApiProperty({ description: '질문' })
  @IsString()
  @IsOptional()
  title?: string | null;

  @ApiProperty({ description: '답변' })
  @IsString()
  @IsOptional()
  body?: string | null;

  @ApiProperty({ description: '이미지들 (string[])', required: true })
  @IsArray()
  @IsOptional()
  images: string[];

  @ApiProperty({ description: '사용자 아이디' })
  @IsNumber()
  @IsOptional()
  userId: number | null;
}
