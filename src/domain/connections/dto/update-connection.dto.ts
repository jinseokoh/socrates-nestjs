import { PartialType } from '@nestjs/swagger';
import { CreateConnectionDto } from 'src/domain/connections/dto/create-connection.dto';
export class UpdateCreationDto extends PartialType(CreateConnectionDto) {}
