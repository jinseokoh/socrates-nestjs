import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Category } from 'src/common/enums/category';
import { Expense } from 'src/common/enums/expense';
import { Gender } from 'src/common/enums/gender';
import { Time } from 'src/common/enums/time';
export class CreateMeetupDto {
  @ApiProperty({ description: '타이틀', required: true })
  @IsString()
  title: string;

  @ApiProperty({ description: '섭타이틀', required: false })
  @IsString()
  @IsOptional()
  subtitle?: string;

  @ApiProperty({ description: '모임정보', required: true })
  @IsString()
  body: string;

  @ApiProperty({ description: '모임이미지', required: true })
  @IsString()
  image: string;

  @ApiProperty({ description: '모임인원', required: true })
  @IsNumber()
  max: number;

  @ApiProperty({ description: 'category', required: true })
  @IsEnum(Category)
  category: Category;

  @ApiProperty({ description: '노출하는 성별', required: false })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiProperty({ description: 'region', required: true })
  @IsNumber()
  @IsOptional()
  region: number;

  @ApiProperty({ description: '섭타이틀', required: true })
  @IsString()
  @IsOptional()
  venue?: string;

  @ApiProperty({ description: '섭타이틀', required: true })
  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  geolocation?: string;

  @ApiProperty({ description: '시간대', required: true })
  @IsEnum(Time)
  time: Time;

  @ApiProperty({ description: '종료시각', required: true })
  @Type(() => Date)
  @IsDate()
  expiredAt: Date;

  @ApiProperty({ description: '비용', required: true })
  @IsEnum(Expense)
  @IsOptional()
  expense?: Expense;

  @ApiProperty({ description: '생성시각 (ISO8601)' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  createdAt?: Date | null;

  @ApiProperty({ description: '수정시각 (ISO8601)' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  updatedAt?: Date | null;

  @ApiProperty({ description: '삭제시각 (ISO8601)' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  deletedAt?: Date | null;

  @ApiProperty({ description: '사용자 아이디' })
  @IsOptional()
  ownerId: string;
}
