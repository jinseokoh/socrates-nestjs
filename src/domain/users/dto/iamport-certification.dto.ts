import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
export class IamportCertificationDto {
  @ApiProperty({ description: '아임포트인증번호' })
  @IsString()
  imp_uid: string;
}
