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
export class YearlyInputDto {
  @ApiProperty({ description: 'date' })
  @Type(() => Date)
  @IsDate()
  date: Date; // YYYY-MM-DD
  @ApiProperty({ description: 'gender', default: Gender.M })
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
  @IsString()
  @IsOptional()
  user_gender?: string | null;

  @ApiProperty({ description: '', required: false })
  @IsNumber()
  @IsOptional()
  specifi_year?: number | null;
  @ApiProperty({ description: '', required: false })
  @IsNumber()
  @IsOptional()
  specifi_month?: number | null;
  @ApiProperty({ description: '', required: false })
  @IsNumber()
  @IsOptional()
  specifi_day?: number | null;
  @ApiProperty({ description: '', required: false })
  @IsNumber()
  @IsOptional()
  user_birth_year?: number | null;
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
}
