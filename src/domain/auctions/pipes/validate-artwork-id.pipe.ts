import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { ArtworksService } from 'src/domain/artworks/artworks.service';
import { AuctionsService } from 'src/domain/auctions/auctions.service';

@Injectable()
export class ValidateArtworkIdPipe implements PipeTransform {
  constructor(
    private readonly artworksService: ArtworksService,
    private readonly auctionsService: AuctionsService,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async transform(value: any, _metadata: ArgumentMetadata) {
    // 1) if param itself exists
    if (!value.hasOwnProperty('artworkId')) {
      throw new BadRequestException(`artworkId is missing`);
    }

    // 2) if artwork exists
    await this.artworksService.findById(value.artworkId);

    // 3) if auction for the artwork exists
    const count = await this.auctionsService.count(value.artworkId);
    if (count > 0) {
      throw new BadRequestException(`associated auction item exists`);
    }

    return value;
  }
}
