import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { QuestionType, TargetGender } from 'src/common/enums';

export class CreateDotDto {
  @ApiProperty({ description: 'slug' })
  @IsString()
  slug: string; // category slug

  @ApiProperty({ description: 'quesiton' })
  @IsString()
  question: string;

  @ApiProperty({ description: 'region', default: QuestionType.SHORT_ANSWER })
  @IsEnum(QuestionType)
  questionType: QuestionType;

  @ApiProperty({ description: 'options', default: null })
  @IsArray()
  @IsOptional()
  options: string[];

  @ApiProperty({ description: 'allow Multiple', default: false })
  @IsBoolean()
  @IsOptional()
  allowMultiple: boolean;

  @ApiProperty({ description: 'isActive', default: false })
  @IsBoolean()
  @IsOptional()
  isActive: boolean;

  @ApiProperty({ description: 'TargetGender' })
  @IsEnum(TargetGender)
  @IsOptional()
  targetGender: TargetGender;

  @ApiProperty({ description: 'min age' })
  @IsNumber()
  @IsOptional()
  targetMinAge: number;

  @ApiProperty({ description: 'max age' })
  @IsNumber()
  @IsOptional()
  targetMaxAge: number;

  @ApiProperty({ description: '사용자 아이디' })
  @IsNumber()
  @IsOptional()
  userId: number | null;
}
