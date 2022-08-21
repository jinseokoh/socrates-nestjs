import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { ArtistsService } from 'src/domain/artists/artists.service';
import { ArtworksService } from 'src/domain/artworks/artworks.service';

@Injectable()
export class ValidateArtistIdPipe implements PipeTransform {
  constructor(
    private readonly artistsService: ArtistsService,
    private readonly artworksService: ArtworksService,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async transform(value: any, _metadata: ArgumentMetadata) {
    // 1) if param itself exists
    if (!value.hasOwnProperty('artistId')) {
      throw new BadRequestException(`artistId is missing`);
    }

    // 2) if another required param exists
    if (!value.hasOwnProperty('title')) {
      throw new BadRequestException(`title is missing`);
    }

    // 3) if artist exists
    const artistId = +value.artistId;
    await this.artistsService.findById(artistId);

    // 4) if artwork with the same title from the artist exists
    const count = await this.artworksService.count(artistId, value.title);
    if (count > 0) {
      throw new BadRequestException(`dupe artwork exists from the artist`);
    }

    return value;
  }
}
