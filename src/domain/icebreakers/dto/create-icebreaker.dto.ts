import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { TargetGender } from 'src/common/enums';

export class CreateIcebreakerDto {
  @ApiProperty({ description: 'userId' })
  @IsNumber()
  @IsOptional()
  userId: number | null;

  @ApiProperty({ description: 'userId' })
  @IsNumber()
  @IsOptional()
  recipientId: number | null;

  @ApiProperty({ description: 'questionId' })
  @IsNumber()
  @IsOptional()
  questionId: number | null;

  @ApiProperty({ description: '상대 성별', default: TargetGender.ALL })
  @IsEnum(TargetGender)
  @IsOptional()
  targetGender: TargetGender;

  @ApiProperty({ description: '상대방 나이 min', default: 18 })
  @IsNumber()
  @IsOptional()
  targetMinAge: number;

  @ApiProperty({ description: '상대방 나이 max', default: 66 })
  @IsNumber()
  @IsOptional()
  targetMaxAge: number;

  @ApiProperty({ description: 'body' })
  @IsString()
  body: string;

  @ApiProperty({ description: 'images', default: null })
  @IsArray()
  @IsOptional()
  images: string[];
}
