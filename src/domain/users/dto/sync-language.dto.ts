import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional } from 'class-validator';
import { Fluency } from 'src/domain/languages/entities/fluency.entity';

export type FluencyWithoutId = Omit<Fluency, 'id'>;
export class SyncLanguageDto {
  @ApiProperty({ description: 'ids', required: false })
  @IsArray()
  @IsOptional()
  ids?: number[] | null;

  @ApiProperty({ description: 'slugs', required: false })
  @IsArray()
  @IsOptional()
  slugs?: string[] | null;

  @ApiProperty({ description: 'Fluencys', required: false })
  @IsArray()
  @IsOptional()
  entities?: FluencyWithoutId[];
}
