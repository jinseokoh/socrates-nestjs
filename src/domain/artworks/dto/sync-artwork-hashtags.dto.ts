import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty } from 'class-validator';
export class SyncArtworkHashtagsDto {
  @ApiProperty({
    description: '해쉬택 아이디들',
    type: 'number',
    isArray: true,
  })
  @Type(() => Number)
  @IsArray()
  @IsNotEmpty()
  ids: number[];
}
