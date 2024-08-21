import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
// import { SubCategory } from 'src/common/enums';
export class CreateProfileDto {
  @ApiProperty({ description: '보유 코인수', required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  balance: number;

  @ApiProperty({ description: '소개글', required: false })
  @IsString()
  @IsOptional()
  bio?: string | null;

  @ApiProperty({ description: '접속지역 slug', required: false })
  @IsString()
  @IsOptional()
  region?: string | null;

  @ApiProperty({ description: '접속지역', required: false })
  @IsString()
  @IsOptional()
  address?: string | null;

  @ApiProperty({ description: 'height', required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  height: number;

  @ApiProperty({ description: '직업', required: false })
  @IsString()
  @IsOptional()
  occupation?: string | null;

  @ApiProperty({ description: '학력', required: false })
  @IsString()
  @IsOptional()
  education?: string | null;

  @ApiProperty({ description: 'MBTI', required: false })
  @IsString()
  @IsOptional()
  mbti?: string | null;

  @ApiProperty({ description: 'fyis', required: false })
  @IsArray()
  @IsOptional()
  fyis?: string[];

  @ApiProperty({ description: 'images', required: false })
  @IsArray()
  @IsOptional()
  images?: string[];

  @ApiProperty({ description: 'options', required: false })
  @IsObject()
  @IsOptional()
  options?: object;

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
