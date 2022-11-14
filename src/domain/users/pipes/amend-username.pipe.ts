import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import * as moment from 'moment';
@Injectable()
export class AmendUsernamePipe implements PipeTransform {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(value: any, _metadata: ArgumentMetadata) {
    if (value.hasOwnProperty('username')) {
      const rule = /^[가-힣A-Za-z0-9_\-]+$/;
      if (!rule.test(value.username)) {
        throw new BadRequestException('invalid username format');
      }

      return {
        ...value,
        usernamedAt: moment().toISOString(),
      };
    }

    return value;
  }
}
