import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
export class CreatesurveyDto {
  @ApiProperty({ description: '작품명', required: true })
  @IsString()
  question: string;

  @ApiProperty({ description: '작품이미지', required: false })
  @IsArray()
  @IsOptional()
  answers?: string[] | null;

  @ApiProperty({ description: '비공개 메모', required: false })
  @IsString()
  @IsOptional()
  note?: string | null;

  @ApiProperty({ description: '작가 아이디', required: false })
  @IsNumber()
  @IsOptional()
  artistId?: number | null;

  @ApiProperty({ description: '리셀러(유저) 아이디', required: false })
  @IsNumber()
  @IsOptional()
  ownerId?: number | null;

  //?-------------------------------------------------------------------------//
  //? additional slack message flag
  //?-------------------------------------------------------------------------//

  @ApiProperty({ description: '슬랙메시지 여부', default: true })
  @IsBoolean()
  @IsOptional()
  slack?: boolean = true;
}
