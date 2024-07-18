import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class UpsertBookmarkDto {
  @ApiProperty({ description: '북마크하는 user 아이디' })
  @IsNumber()
  @IsOptional()
  userId: number;

  @ApiProperty({ description: '북마크대상 feed 아이디' })
  @IsNumber()
  @IsOptional()
  feedId: number;
}
