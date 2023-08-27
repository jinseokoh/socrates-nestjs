import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
// import { SubCategory } from 'src/common/enums';
export class CreateProfileDto {
  @ApiProperty({ description: '소개글', required: false })
  @IsString()
  @IsOptional()
  bio?: string | null;

  @ApiProperty({ description: '접속지역', required: false })
  @IsString()
  @IsOptional()
  region?: string | null;

  @ApiProperty({ description: '학력', required: false })
  @IsString()
  @IsOptional()
  education?: string | null;

  @ApiProperty({ description: '직업', required: false })
  @IsString()
  @IsOptional()
  occupation?: string | null;

  @ApiProperty({ description: 'MBTI', required: false })
  @IsString()
  @IsOptional()
  mbti?: string | null;

  @ApiProperty({ description: 'impressions', required: false })
  @IsArray()
  @IsOptional()
  impressions?: number[];

  @ApiProperty({ description: 'fyis', required: false })
  @IsArray()
  @IsOptional()
  fyis?: string[];

  @ApiProperty({ description: '푸시알림', required: false, default: true })
  @IsBoolean()
  @IsOptional()
  notifyPush?: boolean;

  @ApiProperty({ description: '이메일알림', required: false, default: true })
  @IsBoolean()
  @IsOptional()
  notifyEmail?: boolean;

  @ApiProperty({ description: '카카오알림', required: false, default: true })
  @IsBoolean()
  @IsOptional()
  notifyKakao?: boolean;

  @ApiProperty({ description: 'view수', required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  viewCount: number;

  @ApiProperty({ description: 'post횟수', required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  postCount: number;

  @ApiProperty({ description: 'join수', required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  joinCount: number;

  @ApiProperty({ description: 'pay수', required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  payCount: number;

  @ApiProperty({ description: '사용자 아이디', required: false })
  @IsNumber()
  @IsOptional()
  userId?: number | null;
}
