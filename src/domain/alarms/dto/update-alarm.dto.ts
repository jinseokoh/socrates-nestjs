import { PartialType } from '@nestjs/swagger';
import { CreateAlarmDto } from 'src/domain/alarms/dto/create-alarm.dto';

export class UpdateAlarmDto extends PartialType(CreateAlarmDto) {}
