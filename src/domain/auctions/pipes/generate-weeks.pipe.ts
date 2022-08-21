import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import * as moment from 'moment';
@Injectable()
export class GenerateWeeksPipe implements PipeTransform {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(value: any, _metadata: ArgumentMetadata) {
    if (value.hasOwnProperty('startTime')) {
      const weeks = moment(value.startTime).format(`ggggww`);
      return {
        ...value,
        weeks: +weeks,
      };
    }

    return value;
  }
}
