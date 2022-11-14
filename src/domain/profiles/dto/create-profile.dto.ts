import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
export class CreateProfileDto {
  @ApiProperty({ description: '바이오', required: false })
  @IsString()
  @IsOptional()
  bio?: string | null;

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

  @ApiProperty({ description: '구매횟수', required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  payCount: number;

  @ApiProperty({ description: '조회수', required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  viewCount: number;

  @ApiProperty({ description: '사용자 아이디', required: false })
  @IsNumber()
  @IsOptional()
  userId?: number | null;
}
