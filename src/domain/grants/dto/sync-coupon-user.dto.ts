import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';
export class SyncCouponUserDto {
  @ApiProperty({
    description: '사용자 아이디들',
    type: 'number',
    isArray: true,
  })
  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
