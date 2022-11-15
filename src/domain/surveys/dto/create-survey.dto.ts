import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Category } from 'src/common/enums/category';
export class CreateSurveyDto {
  @ApiProperty({ description: '질문', required: true })
  @IsString()
  question: string;

  @ApiProperty({ description: '답변', required: true })
  @IsArray()
  answers: string[];

  @ApiProperty({
    description: 'category',
    default: Category.FOOD,
  })
  @IsEnum(Category)
  category: Category;

  @ApiProperty({ description: '사용자 아이디' })
  @IsNumber()
  @IsOptional()
  userId: number | null;

  //?-------------------------------------------------------------------------//
  //? additional slack message flag
  //?-------------------------------------------------------------------------//

  // @ApiProperty({ description: '슬랙메시지 여부', default: true })
  // @IsBoolean()
  // @IsOptional()
  // slack?: boolean = true;
}
