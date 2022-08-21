import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty } from 'class-validator';
export class SyncCouponUsersDto {
  @ApiProperty({
    description: '사용자 아이디들',
    type: 'number',
    isArray: true,
  })
  @Type(() => Number)
  @IsArray()
  @IsNotEmpty()
  ids: number[];
}
