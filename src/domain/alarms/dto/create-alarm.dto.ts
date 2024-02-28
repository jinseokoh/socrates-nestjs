import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { AlarmType } from 'src/common/enums';
import { ISender } from 'src/domain/alarms/entities/alarm.interface';

export class CreateAlarmDto {
  @ApiProperty({ description: '사용자 id', required: true })
  @IsNumber()
  userId: number;

  // 빈칸으로 남겨두면 자동생성
  @ApiProperty({
    description: '메시지 id (msg_xxxxxx_userId)',
    required: false,
  })
  @IsString()
  @IsOptional()
  id: string;

  @ApiProperty({
    description: 'type',
    default: AlarmType.GENERAL,
    required: true,
  })
  @IsEnum(AlarmType)
  alarmType: AlarmType;

  @ApiProperty({ description: 'TextAlarm 용 payload', required: true })
  @IsString()
  @IsOptional()
  message: string;

  @ApiProperty({ description: 'TextAlarm 용 payload', required: false })
  @IsString()
  @IsOptional()
  link: string | null;

  @ApiProperty({ description: 'ImageAlarm 용 payload', required: false })
  @IsObject()
  @IsOptional()
  user: ISender | null;

  // 빈칸으로 남겨두면 자동생성
  @ApiProperty({
    description: 'ttl',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  expires: number;
}
