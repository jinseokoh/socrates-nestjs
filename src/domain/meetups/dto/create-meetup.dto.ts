import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { CategoryEnum } from 'src/common/enums/category';
import { DayEnum } from 'src/common/enums/day';
import { ExpenseEnum } from 'src/common/enums/expense';
import { GenderEnum } from 'src/common/enums/gender';
import { RegionEnum } from 'src/common/enums/region';
import { TimeEnum } from 'src/common/enums/time';
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

  @ApiProperty({ description: '이미지들 (String[])', required: false })
  @IsArray()
  @IsOptional()
  images?: string[] | null;

  @ApiProperty({ description: '노출하는 성별', required: false })
  @IsEnum(GenderEnum)
  @IsOptional()
  gender?: GenderEnum;

  @ApiProperty({ description: 'category', required: true })
  @IsEnum(CategoryEnum)
  category: CategoryEnum;

  @ApiProperty({ description: 'region', required: true })
  @IsEnum(RegionEnum)
  region: RegionEnum;

  // @IsString()
  // @IsOptional()
  // geolocation?: string;

  @ApiProperty({ description: '비용', required: true })
  @IsEnum(ExpenseEnum)
  @IsOptional()
  expense?: ExpenseEnum;

  @ApiProperty({ description: '언제', required: false })
  @IsEnum(DayEnum)
  day?: DayEnum;

  @ApiProperty({ description: '시간대', required: true })
  @IsEnum(TimeEnum)
  time: TimeEnum;

  @ApiProperty({ description: 'max 인원', required: true })
  @IsNumber()
  max: number;

  @ApiProperty({ description: 'like count', required: true })
  @IsNumber()
  likeCount: number;

  @ApiProperty({ description: 'view count', required: true })
  @IsNumber()
  viewCount: number;

  @ApiProperty({ description: '신고여부', required: true })
  @IsNumber()
  isFlagged: boolean;

  @ApiProperty({ description: '종료시각', required: true })
  @Type(() => Date)
  @IsDate()
  expiredAt: Date;

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
  userId: string;
}
