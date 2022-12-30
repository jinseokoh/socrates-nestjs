import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import * as moment from 'moment';
@Injectable()
export class YearlyFortunePipe implements PipeTransform {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(value: any, _metadata: ArgumentMetadata) {
    if (value.hasOwnProperty('date') && value.hasOwnProperty('gender')) {
      const now = moment();
      const targetYear =
        now.month() > 10 ? now.clone().add(1, 'year').year() : now.year();

      const dob = moment(value.date);
      return {
        ...value,
        unse_code: 'A104',
        name: '고객',
        gender: value.gender,
        sl_cal: 'S',
        specific_year: `${targetYear}`,
        specific_month: now.format('MM'),
        specific_day: now.format('DD'),
        // user_gender: value.gender,
        // user_birth_year: `${dob.year()}`,
        birth_year: dob.format('YYYY'),
        birth_month: dob.format('MM'),
        birth_day: dob.format('DD'),
        birth_hour: this._convertMomentToChineseTime(dob),
      };
    }

    return value;
  }

  _convertMomentToChineseTime(ts: moment.Moment): string {
    const date = ts.format('YYYY-MM-DD');
    if (ts.isBetween(`${date} 00:00:00`, `${date} 01:30:00`)) {
      return '00';
    }
    if (ts.isBetween(`${date} 01:31:00`, `${date} 03:30:00`)) {
      return '02';
    }
    if (ts.isBetween(`${date} 03:31:00`, `${date} 05:30:00`)) {
      return '04';
    }
    if (ts.isBetween(`${date} 05:31:00`, `${date} 07:30:00`)) {
      return '06';
    }
    if (ts.isBetween(`${date} 07:31:00`, `${date} 09:30:00`)) {
      return '08';
    }
    if (ts.isBetween(`${date} 09:31:00`, `${date} 11:30:00`)) {
      return '10';
    }
    if (ts.isBetween(`${date} 11:31:00`, `${date} 13:30:00`)) {
      return '12';
    }
    if (ts.isBetween(`${date} 13:31:00`, `${date} 15:30:00`)) {
      return '14';
    }
    if (ts.isBetween(`${date} 15:31:00`, `${date} 17:30:00`)) {
      return '16';
    }
    if (ts.isBetween(`${date} 17:31:00`, `${date} 19:30:00`)) {
      return '18';
    }
    if (ts.isBetween(`${date} 19:31:00`, `${date} 21:30:00`)) {
      return '20';
    }
    if (ts.isBetween(`${date} 21:31:00`, `${date} 23:30:00`)) {
      return '22';
    }

    return '24';
  }
}
