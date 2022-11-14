import { PartialType } from '@nestjs/swagger';
import { CreateArtworkDto } from 'src/domain/artworks/dto/create-artwork.dto';
export class UpdateArtworkDto extends PartialType(CreateArtworkDto) {}
