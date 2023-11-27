import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import { DailyFortuneDto } from 'src/domain/users/dto/daily-fortune.dto';
import { LoveFortuneDto } from 'src/domain/users/dto/love-fortune.dto';
import { YearlyFortuneDto } from 'src/domain/users/dto/yearly-fortune.dto';
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

    console.log(divs);

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
    // return data;

    let coupleScore: number;
    let coupleDetail: string;
    let spouseScore: number;
    let spouseDetail: string;
    let friendScore: number;
    let friendDetail: string;
    let partnerScore: number;
    let partnerDetail: string;
    const dom = new JSDOM(data);
    const { document } = dom.window;
    const divs = document.querySelectorAll('div.result_cont');

    divs.forEach((element) => {
      const title = element.querySelector('h3 span');
      const content = element.querySelector('div.content');

      if (title.textContent.includes(`연인`)) {
        const first = content.querySelector('div').children[1];
        const second = content.children[1];
        coupleScore = parseInt(first.textContent);
        coupleDetail = `${second.textContent}`;
      } else if (title.textContent.includes(`결혼`)) {
        const first = content.querySelector('div').children[1];
        const second = content.children[1];
        spouseScore = parseInt(first.textContent);
        spouseDetail = `${second.textContent}`;
      } else if (title.textContent.includes(`친구`)) {
        const first = content.querySelector('div').children[1];
        const second = content.children[1];
        friendScore = parseInt(first.textContent);
        friendDetail = `${second.textContent}`;
      } else if (title.textContent.includes(`직장`)) {
        const first = content.querySelector('div').children[1];
        const second = content.children[1];
        partnerScore = parseInt(first.textContent);
        partnerDetail = `${second.textContent}`;
      }
    });

    return {
      couple: { score: coupleScore, detail: coupleDetail },
      spouse: { score: spouseScore, detail: spouseDetail },
      friend: { score: friendScore, detail: friendDetail },
      partner: { score: partnerScore, detail: partnerDetail },
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
