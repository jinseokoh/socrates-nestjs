import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty } from 'class-validator';
export class SyncRelatedPacksDto {
  @ApiProperty({
    description: '옥션 아이디들',
    type: 'number',
    isArray: true,
  })
  @Type(() => Number)
  @IsArray()
  @IsNotEmpty()
  packIds: number[];
}
