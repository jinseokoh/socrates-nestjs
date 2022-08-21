import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
export class TrackingNumberDto {
  @ApiProperty({ description: '택배번호 (복수일 경우 comma separated 형식)' })
  @IsString()
  trackingNumber: string;
}
