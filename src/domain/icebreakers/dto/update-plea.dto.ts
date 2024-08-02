import { PartialType } from '@nestjs/swagger';
import { CreatePleaDto } from 'src/domain/icebreakers/dto/create-plea.dto';
export class UpdatePleaDto extends PartialType(CreatePleaDto) {}
