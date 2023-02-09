import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { Category } from 'src/common/enums/category';
export class CreateMeetupDto {
  @ApiProperty({ description: '질문', required: true })
  @IsString()
  question: string;

  @ApiProperty({ description: '답변', required: true })
  @IsArray()
  answers: string[];

  @ApiProperty({
    description: 'category',
    default: Category.DINING,
  })
  @IsEnum(Category)
  category: Category;

  @ApiProperty({ description: '사용자 아이디' })
  @IsString()
  @IsOptional()
  userId: string | null;
}
