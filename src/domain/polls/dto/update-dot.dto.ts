import { PartialType } from '@nestjs/swagger';
import { CreateDotDto } from 'src/domain/dots/dto/create-dot.dto';
export class UpdateDotDto extends PartialType(CreateDotDto) {}
