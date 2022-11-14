import { ShippingCost } from 'src/common/types/shipping-cost.type';

// postal code range reference)
// https://imweb.me/faq?mode=view&category=29&category2=40&idx=71671
const calcLocalDeliveryFee = (no: number): ShippingCost => {
  const inRange = (x: number, min: number, max: number) =>
    (x - min) * (x - max) <= 0;

  if (inRange(no, 63000, 63644)) {
    return { reason: '도서지역', cost: 10000 };
  }
  if (inRange(no, 22386, 22388)) {
    return { reason: '도서지역', cost: 10000 };
  }
  if (inRange(no, 23004, 23010)) {
    return { reason: '도서지역', cost: 10000 };
  }
  if (inRange(no, 23100, 23116)) {
    return { reason: '도서지역', cost: 10000 };
  }
  if (inRange(no, 23124, 23136)) {
    return { reason: '도서지역', cost: 10000 };
  }
  if (no === 31708) {
    return { reason: '도서지역', cost: 10000 };
  }
  if (no === 32133) {
    return { reason: '도서지역', cost: 10000 };
  }
  if (no === 33411) {
    return { reason: '도서지역', cost: 10000 };
  }
  if (inRange(no, 40200, 40240)) {
    return { reason: '도서지역', cost: 10000 };
  }
  if (inRange(no, 46768, 46771)) {
    return { reason: '도서지역', cost: 10000 };
  }
  if (inRange(no, 52570, 52571)) {
    return { reason: '도서지역', cost: 10000 };
  }
  if (inRange(no, 53031, 53033)) {
    return { reason: '도서지역', cost: 10000 };
  }
  if (inRange(no, 53089, 53104)) {
    return { reason: '도서지역', cost: 10000 };
  }
  if (no === 54000) {
    return { reason: '도서지역', cost: 10000 };
  }
  if (inRange(no, 56347, 56349)) {
    return { reason: '도서지역', cost: 10000 };
  }
  if (inRange(no, 57068, 57069)) {
    return { reason: '도서지역', cost: 10000 };
  }
  if (inRange(no, 58760, 58762)) {
    return { reason: '도서지역', cost: 10000 };
  }
  if (inRange(no, 58800, 58810)) {
    return { reason: '도서지역', cost: 10000 };
  }
  if (inRange(no, 58816, 58818)) {
    return { reason: '도서지역', cost: 10000 };
  }
  if (no === 28826) {
    return { reason: '도서지역', cost: 10000 };
  }
  if (inRange(no, 58828, 58866)) {
    return { reason: '도서지역', cost: 10000 };
  }
  if (inRange(no, 58953, 58958)) {
    return { reason: '도서지역', cost: 10000 };
  }
  if (inRange(no, 59102, 59103)) {
    return { reason: '도서지역', cost: 10000 };
  }
  if (no === 59106) {
    return { reason: '도서지역', cost: 10000 };
  }
  if (no === 59127) {
    return { reason: '도서지역', cost: 10000 };
  }
  if (no === 59129) {
    return { reason: '도서지역', cost: 10000 };
  }
  if (inRange(no, 59137, 59166)) {
    return { reason: '도서지역', cost: 10000 };
  }
  if (no === 59650) {
    return { reason: '도서지역', cost: 10000 };
  }
  if (no === 59766) {
    return { reason: '도서지역', cost: 10000 };
  }
  if (inRange(no, 59781, 59790)) {
    return { reason: '도서지역', cost: 10000 };
  }

  return { reason: '표준지역', cost: 5000 };
};

const calcOverseaDeliveryFee = (countryCode: string): ShippingCost => {
  switch (countryCode) {
    case 'ng': // Nigeria
    case 'mx': // Mexico
    case 'bd': // Bangladesh
    case 'br': // Brazil
    case 'lk': // Sri Lanka
    case 'ae': // United Arab Emirates
    case 'et': // Ethiopia
    case 'om': // Oman
    case 'jo': // Jordan
    case 'ir': // Iran
    case 'eg': // Egypt
    case 'kz': // Kazakhstan
      return { reason: 'EMS 배송지연국가', cost: 150000 }; // EMS 배송지연 국가
    case 'af': // Afghanistan
    case 'am': // Armenia
    case 'az': // Azerbaijan
    case 'bh': // Bahrain
    case 'bt': // Bhutan
    case 'bn': // Brunei
    case 'kh': // Cambodia
    case 'cn': // China
    case 'cx': // Christmas Island
    case 'cc': // Cocos Islands
    case 'io': // Diego Garcia
    case 'ge': // Georgia
    case 'hk': // Hong Kong
    case 'in': // India
    case 'id': // Indonesia
    case 'iq': // Iraq
    case 'il': // Israel
    case 'jp': // Japan
    case 'kw': // Kuwait
    case 'kg': // Kyrgyzstan
    case 'la': // Laos
    case 'lb': // Lebanon
    case 'mo': // Macau
    case 'my': // Malaysia
    case 'mv': // Maldives
    case 'mn': // Mongolia
    case 'mm': // Myanmar
    case 'np': // Nepal
    case 'pk': // Pakistan
    case 'ps': // Palestine
    case 'ph': // Philippines
    case 'qa': // Qatar
    case 'sa': // Saudi Arabia
    case 'sg': // Singapore
    case 'kr': // South Korea
    case 'sy': // Syria
    case 'tw': // Taiwan
    case 'tj': // Tajikistan
    case 'th': // Thailand
    case 'tr': // Turkey/Türkiye
    case 'tm': // Turkmenistan
    case 'uz': // Uzbekistan
    case 'vn': // Vietnam
    case 'ye': // Yemen
      return { reason: '아시아권 국가', cost: 60000 }; // 아시아권 국가
  }
  return { reason: '비아시안권 국가', cost: 120000 }; // 비아시아권 국가
};

export const calcShippingCost = (
  countryCode: string,
  postalCode: string,
): ShippingCost => {
  return countryCode === 'kr'
    ? calcLocalDeliveryFee(parseInt(postalCode, 10))
    : calcOverseaDeliveryFee(countryCode);
};

export const PACKING_PRICE = 5000;
