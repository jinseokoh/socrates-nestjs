import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty } from 'class-validator';
export class SyncHashtagArtworksDto {
  @ApiProperty({
    description: '작품 }아이디들',
    type: 'number',
    isArray: true,
  })
  @Type(() => Number)
  @IsArray()
  @IsNotEmpty()
  ids: number[];
}
