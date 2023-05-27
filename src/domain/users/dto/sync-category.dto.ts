import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional } from 'class-validator';
export class SyncCategoryDto {
  @ApiProperty({ description: 'ids', required: false })
  @IsArray()
  @IsOptional()
  ids?: number[] | null;

  @ApiProperty({ description: 'slugs', required: false })
  @IsArray()
  @IsOptional()
  slugs?: string[] | null;
}
