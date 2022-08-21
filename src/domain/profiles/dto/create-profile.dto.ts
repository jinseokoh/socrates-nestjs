import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
export class CreateProfileDto {
  @ApiProperty({ description: '바이오', required: false })
  @IsString()
  @IsOptional()
  bio?: string | null;

  @ApiProperty({ description: '우편번호', required: false })
  @IsString()
  @IsOptional()
  postalCode?: string | null;

  @ApiProperty({ description: '주소', required: false })
  @IsString()
  @IsOptional()
  address?: string | null;

  @ApiProperty({ description: '상세주소', required: false })
  @IsString()
  @IsOptional()
  addressDetail?: string | null;

  @ApiProperty({ description: '시', required: false })
  @IsString()
  @IsOptional()
  city?: string | null;

  @ApiProperty({ description: '특별시/광역시/도', required: false })
  @IsString()
  @IsOptional()
  state?: string | null;

  @ApiProperty({ description: '국가', required: false })
  @IsString()
  @IsOptional()
  country?: string | null;

  @ApiProperty({ description: '푸시알림', required: false, default: true })
  @IsBoolean()
  @IsOptional()
  notifyPush?: boolean;

  @ApiProperty({ description: '카카오알림', required: false, default: true })
  @IsBoolean()
  @IsOptional()
  notifyKakao?: boolean;

  @ApiProperty({ description: '이메일알림', required: false, default: true })
  @IsBoolean()
  @IsOptional()
  notifyEmail?: boolean;

  @ApiProperty({ description: '이벤트알림', required: false, default: true })
  @IsBoolean()
  @IsOptional()
  notifyEvent?: boolean;

  @ApiProperty({ description: '조회수', required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  viewCount: number;

  @ApiProperty({ description: '마지막 로그인', required: false })
  @Type(() => Date)
  @IsOptional()
  loggedAt?: string | null;

  @ApiProperty({ description: '마지막 닉네임 변경일', required: false })
  @Type(() => Date)
  @IsOptional()
  usernamedAt?: string | null;

  @ApiProperty({ description: '사용자 아이디', required: false })
  @IsNumber()
  @IsOptional()
  userId?: number | null;
}
