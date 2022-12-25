import { Injectable } from '@nestjs/common';
import axios from 'axios';

import { Iconv } from 'iconv';
import { JSDOM } from 'jsdom';
import { BioDto } from 'src/domain/users/dto/biod-dto';
import { convertUtf8ToEucKr } from 'src/helpers/ko-encoder';
@Injectable()
export class CrawlerService {
  // ref) https://kdexp.com/main.kd

  async askLuck(params: any): Promise<any> {
    const { data } = await axios.post(
      'https://shinhanlife.sinbiun.com/unse/good_luck.php',
      {
        unse_code: 'A104',
        name: '고객',
        specific_year: '2022',
        specific_month: '12',
        specific_day: '25',
        user_gender: 'M',
        user_birth_year: '1970',
        gender: 'M',
        sl_cal: 'S',
        birth_year: '1970',
        birth_month: '1',
        birth_day: '17',
        birth_hour: '04',
        sp_num: '2022-12-26',
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    // return data;
    const items: string[] = [];
    const months: string[] = [];
    const dom = new JSDOM(data);
    const { document } = dom.window;
    const divs = document.querySelectorAll('div.result_cont');

    divs.forEach((element) => {
      const title = element.querySelector('h3 span');
      const content = element.querySelector('div.content');
      const outerList = content.querySelectorAll('ul.month_li > li');

      if (outerList && outerList.length > 0) {
        outerList.forEach((v) => {
          const items = v.querySelectorAll('ul > li');
          const monthText = items[0] ? items[0].textContent : null;
          const monthDesc = items[1] ? items[1].textContent : null;
          months.push(`${monthText} : ${monthDesc}`);
        });
      } else {
        items.push(`${title.textContent} : ${content.textContent}`);
      }
    });

    return {
      items,
      months,
    };
  }

  async askLove(params: any): Promise<any> {
    const { data } = await axios.post(
      'https://shinhanlife.sinbiun.com/unse/good_luck.php',
      {
        unse_code: 'B017',
        name: '고객',
        specific_year: '2022',
        specific_month: '12',
        specific_day: '25',
        user_gender: '',
        user_birth_year: '',

        gender: 'M',
        sl_cal: 'S',
        birth_year: '1970',
        birth_month: '1',
        birth_day: '17',
        birth_hour: '04',

        gender2: 'M',
        sl_cal2: 'S',
        birth_year2: '1970',
        birth_month2: '1',
        birth_day2: '17',
        birth_hour2: '04',

        // sp_num: '2022-12-26',
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    const items: string[] = [];
    // const months: string[] = [];
    const dom = new JSDOM(data);
    const { document } = dom.window;
    const divs = document.querySelectorAll('div.result_area > div.result_cont');

    divs.forEach((element) => {
      const span = element.querySelector('h3 > span.tit_txt');
      const divs = element.querySelectorAll('div > div.content');

      const title = span ? span.textContent : null;
      const description = divs[1] ? divs[1].textContent : null;
      const rating = divs[0]
        ? divs[0].querySelector('div.view > div > div > span.u_point')
            .textContent
        : null;
      items.push(`${title} : ${rating} : ${description}`);
    });

    return {
      items,
    };
  }

  async askYuksul(dto: BioDto): Promise<any> {
    let { data } = await axios.post(
      'http://www.yuksul.com/scripts/n_tojung.asp',
      {
        url_root: 'http://www.yuksul.com/',
        solunar: 'solar',
        year: dto.date.split('-')[0],
        month: dto.date.split('-')[1],
        day: dto.date.split('-')[2],
        hour: dto.time.split(':')[0],
        minute: dto.time.split(':')[1],
        youn: '0',
        sex:
          dto.gender === 'M'
            ? convertUtf8ToEucKr('남')
            : convertUtf8ToEucKr('여'),
        nowyear: dto.year.toString(),
      },
      {
        //responseType: 'arraybuffer',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          //'Accept-Charset': 'euc-kr',
        },
      },
    );

    const iconv = new Iconv('euc-kr', 'utf-8//translit//ignore');
    const bin = iconv.convert(data);
    data = bin.toString();

    data = data.replace(
      /\s*<\/td>\s*<\/tr>\s*<\/table>\s*<\/td>\s*<\/tr>\s*<tr>\s*<td.*?>\s*<p.*?><a.*?><img.*?><\/a><\/p>[\S\s]*/,
      '</html>',
    );
    data = data.replace(/[\S\s]*<table.*>\s*/, '<table>\n');
    data = `<html>${data}`;

    const items: string[] = [];
    const dom = new JSDOM(data);
    const { document } = dom.window;
    const table = document.querySelectorAll('table')[0];

    table.querySelectorAll('tr').forEach((element) => {
      const p = element.querySelector('td p');
      const item = p.textContent ? p.textContent.trim() : null;

      try {
        if (item) {
          items.push(item);
        }
      } catch (e) {
        items.push('error');
      }
    });

    return items;
  }

  //--------------------------------------------------------------------------//
  // private
  //--------------------------------------------------------------------------//

  _trimInfoMessage(val: any): string | null {
    if (!val) {
      return null;
    }

    return val.textContent.trim().replace('\n', '').replace(/ :\s+/, ':');
  }
}
