import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { Orientation, Size } from 'src/common/enums';
import { ArtworksService } from 'src/domain/artworks/artworks.service';

@Injectable()
export class RevampArtworkDtoPipe implements PipeTransform {
  constructor(private readonly artworksService: ArtworksService) {}

  sizer = (width: number, height: number) => {
    if (width < 350 && height < 350) {
      return Size.S;
    }
    if (width < 610 && height < 610) {
      return Size.M;
    }
    if (width < 900 && height < 900) {
      return Size.L;
    }

    return Size.XL;
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async transform(value: any, _metadata: ArgumentMetadata) {
    if (value.hasOwnProperty('width') && value.hasOwnProperty('height')) {
      const width = value.width;
      const height = value.height;
      const orientation =
        width === height
          ? Orientation.SQUARE
          : width > height
          ? Orientation.LANDSCAPE
          : Orientation.PORTRAIT;

      const size = this.sizer(width, height);
      const isCombinable = size === Size.XL ? false : true;
      return {
        ...value,
        size,
        orientation,
        isCombinable,
      };
    }

    return value;
  }
}
