import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
export class UserSocialIdDto {
  @ApiProperty({ description: '이메일' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: '소셜인증업체명' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(16)
  providerName: string;

  @ApiProperty({ description: '소셜인증아이디' })
  @IsNotEmpty()
  @IsString()
  providerId: string;

  @ApiProperty({ description: '이름', default: false })
  @IsString()
  @IsOptional()
  name?: string | null;

  @ApiProperty({ description: '전화번호', default: false })
  @IsString()
  @IsOptional()
  phone?: string | null;

  @ApiProperty({ description: '사진', default: false })
  @IsString()
  @IsOptional()
  photo?: string | null;

  @ApiProperty({ description: '성별', default: false })
  @IsString()
  @IsOptional()
  gender?: string | null;

  @ApiProperty({ description: '생일', default: false })
  @IsString()
  @IsOptional()
  dob?: string | null;
}
