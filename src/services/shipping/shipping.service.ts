import { Injectable } from '@nestjs/common';
import axios from 'axios';

import { Iconv } from 'iconv';
import { JSDOM } from 'jsdom';
import { ShippingStatus } from 'src/common/enums/shipping-status';
import { TrackItem } from 'src/common/types/track-item.type';
import { TrackResult } from 'src/common/types/track-result.type';
import { BioDto } from 'src/domain/orders/dto/bio-dto';
import { convertUtf8ToEucKr } from 'src/helpers/ko-encoder';
@Injectable()
export class ShippingService {
  // ref) https://kdexp.com/main.kd
  async checkKd(trackingNumber: string): Promise<TrackResult> {
    const res = await axios.get('https://kdexp.com/newDeliverySearch.kd', {
      params: {
        barcode: trackingNumber,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.data.items) {
      return {
        status: ShippingStatus.NUMBER_ISSUED,
        details: [],
      };
    }

    const details = res.data.items.map((v: any) => {
      return {
        status: v.stat,
        location: v.location,
        info: v.tel,
        registeredAt: v.reg_date,
      };
    });

    const status = details.find((v: TrackItem) => v.status === '배송완료')
      ? ShippingStatus.DELIVERED
      : ShippingStatus.IN_TRANSIT;

    return {
      status,
      details,
    };
  }

  // ref) https://trace.epost.go.kr/ipl.tts.tt.epost.web.OrderEpostEventMgmt.retrieveEmsTraceEngC.do
  async checkEms(trackingNumber: string): Promise<TrackResult> {
    const res = await axios.post(
      'https://trace.epost.go.kr/ipl.tts.tt.epost.web.OrderEpostEventMgmt.retrieveEmsTraceEngC.do',
      {
        target_command: 'kpl.tts.tt.epost.cmd.RetrieveEmsTraceEngCmd',
        JspURI: '/xtts/tt/epost/ems/EmsSearchResultEng.jsp',
        POST_CODE: trackingNumber,
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    const dom = new JSDOM(res.data);
    const { document } = dom.window;
    const table = document.querySelectorAll('table')[1];

    const error = table
      ? table.querySelector('tr:first-child td[colspan="4"]')
      : true;

    if (error) {
      return {
        status: ShippingStatus.NUMBER_ISSUED,
        details: [],
      };
    }

    const details: TrackItem[] = [];
    table.querySelectorAll('tbody tr').forEach((element) => {
      const tds = element.querySelectorAll('td');

      const item = {
        status: tds[1].textContent.trim(),
        location: tds[2].textContent.trim(),
        info: this._trimInfoMessage(tds[3].querySelector('p:first-child')),
        registeredAt: tds[0].textContent.trim(),
      };

      details.push(item);
    });

    const status = details.find((v) => v.status === 'Delivery complete')
      ? ShippingStatus.DELIVERED
      : ShippingStatus.IN_TRANSIT;

    return {
      status,
      details,
    };
  }

  async checkBio(dto: BioDto): Promise<any> {
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
        responseType: 'arraybuffer',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept-Charset': 'euc-kr',
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

    // console.log(data);

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
