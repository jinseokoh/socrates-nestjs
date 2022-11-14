import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
export class CreateHashtagDto {
  @ApiProperty({ description: 'key' })
  @IsString()
  key: string;

  @ApiProperty({ description: 'title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'parentId' })
  @IsNumber()
  @IsOptional()
  parentId: number | null;
}
