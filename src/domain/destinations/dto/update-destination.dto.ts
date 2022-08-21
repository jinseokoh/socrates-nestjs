import { PartialType } from '@nestjs/swagger';
import { CreateDestinationDto } from 'src/domain/destinations/dto/create-destination.dto';

export class UpdateDestinationDto extends PartialType(CreateDestinationDto) {}
