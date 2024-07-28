import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePollDto {
  @ApiProperty({ description: 'slug' })
  @IsString()
  slug: string; // category slug

  @ApiProperty({ description: 'quesiton' })
  @IsString()
  question: string;

  @ApiProperty({ description: 'options', default: null })
  @IsArray()
  options: string[];

  @ApiProperty({ description: 'isMultiple', default: false })
  @IsBoolean()
  @IsOptional()
  isMultiple: boolean;

  @ApiProperty({ description: '사용자 아이디' })
  @IsNumber()
  @IsOptional()
  userId: number | null;
}
