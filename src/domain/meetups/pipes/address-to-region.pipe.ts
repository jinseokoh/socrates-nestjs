import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { addressToRegion } from 'src/helpers/address-to-region';

@Injectable()
export class AddressToRegionPipe implements PipeTransform {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(value: any, _metadata: ArgumentMetadata) {
    if (value.hasOwnProperty('venue')) {
      const region = addressToRegion(value.venue.address);
      return {
        ...value,
        region: region, // string
      };
    }

    return value;
  }
}
