import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateDotDto {
  @ApiProperty({ description: 'slug' })
  @IsString()
  slug: string;

  @ApiProperty({ description: 'quesiton' })
  @IsString()
  question: string;

  @ApiProperty({ description: '사용자 아이디' })
  @IsNumber()
  @IsOptional()
  userId: number | null;
}
