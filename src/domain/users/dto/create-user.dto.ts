import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Role } from 'src/common/enums';
export class CreateUserDto {
  @ApiProperty({ description: '닉네임', required: false })
  @IsString()
  @IsOptional()
  username?: string | null;

  @ApiProperty({ description: '전화번호', required: false })
  @IsString()
  @IsOptional()
  phone?: string | null;

  @ApiProperty({ description: '이메일' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '비밀번호', required: false })
  @IsString()
  @IsOptional()
  password?: string | null;

  @ApiProperty({ description: '실명', required: false })
  @IsString()
  @IsOptional()
  realname?: string | null;

  @ApiProperty({ description: '아바타', required: false })
  @IsString()
  @IsOptional()
  avatar?: string | null;

  @ApiProperty({ description: '푸시토큰', required: false })
  @IsString()
  @IsOptional()
  pushToken?: string | null;

  @ApiProperty({ description: '리플래쉬 토큰 해쉬값', required: false })
  @IsString()
  @IsOptional()
  refreshTokenHash?: string | null;

  @ApiProperty({
    description: '사용자역할',
    required: false,
    default: Role.USER,
  })
  @IsEnum(Role)
  @IsOptional()
  role?: Role | null;

  @ApiProperty({
    description: '구매횟수',
    required: false,
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  score?: number | null;

  @ApiProperty({ description: '로케일정보', required: false, default: 'ko' })
  @IsString()
  @IsOptional()
  locale?: string | null;

  @ApiProperty({ description: '활성화 여부', required: false, default: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean | null;

  @ApiProperty({
    description: '마지막 닉네임 변경일',
    required: false,
    default: false,
  })
  @Type(() => Date)
  @IsOptional()
  usernamedAt?: string | null;
}
