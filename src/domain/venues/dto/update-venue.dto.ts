import { PartialType } from '@nestjs/swagger';
import { CreateVenueDto } from 'src/domain/venues/dto/create-venue.dto';
export class UpdateVenueDto extends PartialType(CreateVenueDto) {}
