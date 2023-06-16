import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { Role } from 'src/common/enums';
import { Career } from 'src/common/enums/career';
import { Gender } from 'src/common/enums/gender';
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

  @ApiProperty({ description: '성별', required: false })
  @IsEnum(Gender)
  @IsOptional()
  gender: Gender | null;

  @ApiProperty({ description: '직군', required: false })
  @IsEnum(Career)
  @IsOptional()
  career: Career | null;

  @ApiProperty({
    description: 'date of birth',
    required: false,
    default: false,
  })
  @Type(() => Date)
  @IsOptional()
  dob?: string | null;

  @ApiProperty({ description: '아바타', required: false })
  @IsString()
  @IsOptional()
  avatar?: string | null;

  @ApiProperty({ description: '디바이스 타입', required: false })
  @IsString()
  @IsOptional()
  deviceType?: string | null;

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

  @ApiProperty({ description: '로케일정보', required: false, default: 'ko' })
  @IsString()
  @IsOptional()
  locale?: string | null;

  @ApiProperty({
    description: '이메일확인 여부',
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean | null;

  @ApiProperty({
    description: '프로필 공개여부',
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isAnonymous?: boolean | null;

  @ApiProperty({
    description: '사용정지 여부',
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isBanned?: boolean | null;

  @ApiProperty({
    description: '히스토리 공개여부',
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean | null;
}
