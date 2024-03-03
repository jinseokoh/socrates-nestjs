import { PartialType } from '@nestjs/swagger';
import { CreatePleaDto } from 'src/domain/users/dto/create-plea.dto';
export class UpdatePleaDto extends PartialType(CreatePleaDto) {}
