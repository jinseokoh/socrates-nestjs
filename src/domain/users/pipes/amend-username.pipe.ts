import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import * as moment from 'moment';
@Injectable()
export class AmendUsernamePipe implements PipeTransform {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(value: any, _metadata: ArgumentMetadata) {
    if (value.hasOwnProperty('username')) {
      return {
        ...value,
        usernamedAt: moment().toISOString(),
      };
    }

    return value;
  }
}
