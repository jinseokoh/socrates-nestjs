import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Genre } from 'src/common/enums';
export class CreateArtistDto {
  @ApiProperty({ description: '이름 🔍' })
  @IsString()
  @IsOptional()
  name: string | null;

  @ApiProperty({ description: '소개 🔍' })
  @IsString()
  @IsOptional()
  intro?: string | null;

  @ApiProperty({ description: '연혁 🔍', required: false })
  @IsString()
  @IsOptional()
  credentials?: string | null;

  @ApiProperty({ description: '작가SNS', required: false })
  @IsString()
  @IsOptional()
  sns?: string | null;

  @ApiProperty({
    description: '작가분류 💡',
    default: Genre.PAINTER,
  })
  @IsEnum(Genre)
  genre: Genre = Genre.PAINTER;

  @ApiProperty({ description: '국적', default: 'kr' })
  @IsString()
  nationality = 'kr';

  @ApiProperty({ description: '미공개 메모', required: false })
  @IsString()
  @IsOptional()
  note?: string | null;

  @ApiProperty({ description: '사용자 아이디', required: false })
  @IsNumber()
  userId: number;
}
