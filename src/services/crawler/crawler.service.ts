import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import { DailyFortuneDto } from 'src/domain/users/dto/daily-fortune-dto';
import { LoveFortuneDto } from 'src/domain/users/dto/love-fortune-dto';
import { YearlyFortuneDto } from 'src/domain/users/dto/yearly-fortune-dto';
@Injectable()
export class CrawlerService {
  // ref) https://kdexp.com/main.kd

  async askYearly(dto: YearlyFortuneDto): Promise<any> {
    const { data } = await axios.post(
      'https://shinhanlife.sinbiun.com/unse/good_luck.php',
      dto,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );
    console.log(dto);
    // return data;

    let summary: string;
    let money: string;
    let business: string;
    let family: string;
    let relationship: string;
    const details: string[] = [];
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
          details.push(`${monthText}. ${monthDesc}`);
        });
      } else {
        if (title.textContent.includes(`총론`)) {
          summary = `${content.textContent}`;
        } else if (title.textContent.includes(`재물`)) {
          money = `${content.textContent}`;
        } else if (title.textContent.includes(`사업`)) {
          business = `${content.textContent}`;
        } else if (title.textContent.includes(`가정`)) {
          family = `${content.textContent}`;
        } else {
          relationship = `${content.textContent}`;
        }
      }
    });

    return {
      summary,
      money,
      business,
      family,
      relationship,
      details,
    };
  }

  async askDaily(dto: DailyFortuneDto): Promise<any> {
    const { data } = await axios.post(
      'https://shinhanlife.sinbiun.com/unse/good_luck.php',
      dto,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );
    console.log(dto);
    // return data;

    let score: number;
    let summary: string;
    let luck: string;
    let money: string;
    let love: string;
    const dom = new JSDOM(data);
    const { document } = dom.window;
    const divs = document.querySelectorAll('div.result_cont');

    divs.forEach((element) => {
      const title = element.querySelector('h3 span');
      const content = element.querySelector('div.content');

      if (title.textContent.includes(`미니`)) {
        const first = content.querySelector('div').children[1];
        const second = content.children[1];
        score = parseInt(first.textContent);
        summary = `${second.textContent}`;
      } else if (title.textContent.includes(`총론`)) {
        luck = `${content.textContent}`;
      } else if (title.textContent.includes(`재물`)) {
        money = `${content.textContent}`;
      } else if (title.textContent.includes(`러브`)) {
        love = `${content.textContent}`;
      }
    });

    return {
      score,
      summary,
      luck,
      money,
      love,
    };
  }

  async askLove(dto: LoveFortuneDto): Promise<any> {
    const { data } = await axios.post(
      'https://shinhanlife.sinbiun.com/unse/good_luck.php',
      dto,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );
    console.log(dto);
    return data;

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
