import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateDotDto {
  @ApiProperty({ description: 'slug' })
  @IsString()
  slug: string; // category slug

  @ApiProperty({ description: 'quesiton' })
  @IsString()
  question: string;

  @ApiProperty({ description: 'options', default: [] })
  @IsArray()
  @IsOptional()
  options: string[];

  @ApiProperty({ description: '사용자 아이디' })
  @IsNumber()
  @IsOptional()
  userId: number | null;
}
