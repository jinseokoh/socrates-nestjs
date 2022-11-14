import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { Courier } from 'src/common/enums/courier';
export class TrackingNumberDto {
  @ApiProperty({ description: '택배사', default: Courier.KDEXP })
  @IsEnum(Courier)
  courier: Courier;

  @ApiProperty({ description: '택배번호' })
  @IsString()
  trackingNumber: string;
}
