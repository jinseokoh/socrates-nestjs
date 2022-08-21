import { PartialType } from '@nestjs/swagger';
import { CreateArtistDto } from 'src/domain/artists/dto/create-artist.dto';
export class UpdateArtistDto extends PartialType(CreateArtistDto) {}
