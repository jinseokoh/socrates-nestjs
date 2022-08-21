import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { ArtworksService } from 'src/domain/artworks/artworks.service';

@Injectable()
export class DefaultAuctionImagesPipe implements PipeTransform {
  constructor(private readonly artworksService: ArtworksService) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async transform(value: any, _metadata: ArgumentMetadata) {
    // 1) if param itself exists
    if (!value.hasOwnProperty('images')) {
      const artwork = await this.artworksService.findById(+value.artworkId);
      value.images = artwork.images;
    }

    return value;
  }
}
