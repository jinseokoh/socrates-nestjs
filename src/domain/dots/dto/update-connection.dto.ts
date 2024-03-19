import { PartialType } from '@nestjs/swagger';
import { CreateConnectionDto } from 'src/domain/dots/dto/create-connection.dto';
export class UpdateConnectionDto extends PartialType(CreateConnectionDto) {}
