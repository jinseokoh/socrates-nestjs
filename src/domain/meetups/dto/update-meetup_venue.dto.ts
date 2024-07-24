import { PartialType } from '@nestjs/swagger';
import { CreateVenueDto } from 'src/domain/meetups/dto/create-meetup_venue.dto';
export class UpdateVenueDto extends PartialType(CreateVenueDto) {}
