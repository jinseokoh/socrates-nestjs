import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Gender } from 'src/common/enums/gender';
export class DailyFortuneDto {
  @ApiProperty({ description: 'dob' })
  @Type(() => Date)
  @IsDate()
  dob: Date; // YYYY-MM-DD

  @ApiProperty({ description: 'gender', default: Gender.MALE })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ description: '', required: false })
  @IsString()
  @IsOptional()
  unse_code?: string | null;
  @ApiProperty({ description: '', required: false })
  @IsString()
  @IsOptional()
  name?: string | null;
  @ApiProperty({ description: '', required: false })
  @IsString()
  @IsOptional()
  sl_cal?: string | null;

  @ApiProperty({ description: '', required: false })
  @IsNumber()
  @IsOptional()
  birth_year?: number | null;
  @ApiProperty({ description: '', required: false })
  @IsNumber()
  @IsOptional()
  birth_month?: number | null;
  @ApiProperty({ description: '', required: false })
  @IsNumber()
  @IsOptional()
  birth_day?: number | null;
  @ApiProperty({ description: '', required: false })
  @IsString()
  @IsOptional()
  birth_hour?: string | null;
  @ApiProperty({ description: '', required: false })
  @IsString()
  @IsOptional()
  sp_num?: string | null;
}
