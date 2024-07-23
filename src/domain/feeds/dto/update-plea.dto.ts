import { PartialType } from '@nestjs/swagger';
import { CreatePleaDto } from 'src/domain/feeds/dto/create-plea.dto';
export class UpdatePleaDto extends PartialType(CreatePleaDto) {}
