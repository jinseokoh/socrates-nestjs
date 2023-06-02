import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
export class CreateSecretDto {
  @ApiProperty({ description: 'key' })
  @IsString()
  key: string;

  @ApiProperty({ description: 'otp' })
  @IsString()
  @IsOptional()
  otp: string;
}
