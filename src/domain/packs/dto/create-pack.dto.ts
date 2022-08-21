import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';
export class CreatePackDto {
  @ApiProperty({ description: '제목 🔍' })
  @IsString()
  title: string;

  @ApiProperty({ description: '요약 🔍' })
  @IsString()
  summary: string;

  @ApiProperty({ description: '이미지들 (String[])' })
  @IsArray()
  @IsOptional()
  images?: string[] | null;

  @ApiProperty({ description: '활성화 여부' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean | null;

  @ApiProperty({ description: '기획전에 포함시킬 옥션 아이디들 (Number[])' })
  @IsArray()
  @IsOptional()
  auctionIds?: number[] | null;
}
