import { PartialType } from '@nestjs/swagger';
import { CreatePackDto } from 'src/domain/packs/dto/create-pack.dto';
export class UpdatePackDto extends PartialType(CreatePackDto) {}
