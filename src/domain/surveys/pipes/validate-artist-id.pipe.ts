import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Artist } from 'src/domain/artists/artist.entity';
import { Artwork } from 'src/domain/artworks/artwork.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ValidateArtistIdPipe implements PipeTransform {
  constructor(
    @InjectRepository(Artist)
    private readonly artistsRepository: Repository<Artist>,
    @InjectRepository(Artwork)
    private readonly artworksRepository: Repository<Artwork>,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async transform(value: any, _metadata: ArgumentMetadata) {
    // if artist exists
    if (value.hasOwnProperty('artistId')) {
      const artistId = +value.artistId;
      await this.artistsRepository.findOneOrFail(artistId);

      if (value.hasOwnProperty('title')) {
        const title = value.title;
        const count = await this.artworksRepository.count({
          where: {
            artistId,
            title,
          },
        });
        if (count > 0) {
          throw new BadRequestException(`duplicate artwork exists`);
        }
      }
    }

    return value;
  }
}
