import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, MinLength } from 'class-validator';
export class ChangePasswordDto {
  @ApiProperty({ description: '현재 비밀번호' })
  @IsNotEmpty()
  @IsString()
  @Length(6)
  current: string;
  @ApiProperty({ description: '비밀번호' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}
