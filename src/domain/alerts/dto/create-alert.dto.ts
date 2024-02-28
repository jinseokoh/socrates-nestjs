import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { AlertType } from 'src/common/enums';
import { ISender } from 'src/domain/alerts/entities/alert.interface';

export class CreateAlertDto {
  @ApiProperty({ description: '사용자 id', required: true })
  @IsNumber()
  userId: number;

  @ApiProperty({ description: '메시지 id (msg_xxxxxx)', required: true })
  @IsString()
  @IsOptional()
  id: string;

  @ApiProperty({
    description: 'type',
    default: AlertType.GENERAL,
    required: true,
  })
  @IsEnum(AlertType)
  alertType: AlertType;

  @ApiProperty({ description: 'TextAlert 용 payload', required: true })
  @IsString()
  @IsOptional()
  message: string;

  @ApiProperty({ description: 'TextAlert 용 payload', required: false })
  @IsString()
  @IsOptional()
  link: string | null;

  @ApiProperty({ description: 'ImageAlert 용 payload', required: false })
  @IsObject()
  @IsOptional()
  user: ISender | null;

  @ApiProperty({ description: 'ttl', required: false })
  @IsNumber()
  @IsOptional()
  expires: number;

  @ApiProperty({ description: 'createdAt', required: true })
  @IsNumber()
  // @IsOptional()
  createdAt: number;

  @ApiProperty({ description: 'updatedAt' })
  @IsNumber()
  @IsOptional()
  updatedAt: number;
}
