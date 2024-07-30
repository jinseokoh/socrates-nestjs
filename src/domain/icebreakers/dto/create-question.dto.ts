import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateQuestionDto {
  @ApiProperty({ description: 'slug' })
  @IsString()
  category: string; // category slug

  @ApiProperty({ description: 'body' })
  @IsString()
  body: string;

  @ApiProperty({ description: 'isActive', default: false })
  @IsBoolean()
  @IsOptional()
  isAnonymous: boolean;

  @ApiProperty({ description: '사용자 아이디' })
  @IsNumber()
  @IsOptional()
  userId: number | null;
}
