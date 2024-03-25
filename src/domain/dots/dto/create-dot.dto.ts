import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { DotStatus } from 'src/common/enums';

export class CreateDotDto {
  @ApiProperty({ description: 'slug' })
  @IsString()
  slug: string; // category slug

  @ApiProperty({ description: 'quesiton' })
  @IsString()
  question: string;

  @ApiProperty({ description: 'region', default: DotStatus.SHORT_ANSWER })
  @IsEnum(DotStatus)
  status: DotStatus;

  @ApiProperty({ description: 'options', default: [] })
  @IsArray()
  @IsOptional()
  options: string[];

  @ApiProperty({ description: 'allow Multiple', default: false })
  @IsBoolean()
  @IsOptional()
  allowMultiple: boolean;

  @ApiProperty({ description: '사용자 아이디' })
  @IsNumber()
  @IsOptional()
  userId: number | null;
}
