import { PartialType } from '@nestjs/swagger';
import { CreateAlertDto } from 'src/domain/alerts/dto/create-alert.dto';

export class UpdateAlertDto extends PartialType(CreateAlertDto) {}
