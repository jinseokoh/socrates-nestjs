import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { GameCategory } from 'src/common/enums/game-category';
export class CreateNewsDto {
  @ApiProperty({ description: '공지사항 제목' })
  @IsString()
  title: string;

  @ApiProperty({ description: '공지사항 본문' })
  @IsString()
  @IsOptional()
  body?: string | null;

  @ApiProperty({ description: '공지사항 이미지', required: false })
  @IsString()
  @IsOptional()
  image?: string | null;

  @ApiProperty({
    description: '공지사항 분류',
    default: GameCategory.FOOD,
  })
  @IsEnum(GameCategory)
  @IsOptional()
  category?: GameCategory;

  @ApiProperty({
    description: '공지사항 고정여부',
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isFixed?: boolean;

  @ApiProperty({
    description: '공지사항 공개여부',
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}
