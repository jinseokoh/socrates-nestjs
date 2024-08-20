import { Region } from 'src/common/enums';

export const addressToRegion = (address: string): Region => {
  if (address.match(/^서울/)) {
    return Region.SEOUL;
  }
  if (address.match(/^부산/)) {
    return Region.BUSAN;
  }
  if (address.match(/^인천/)) {
    return Region.INCHEON;
  }
  if (address.match(/^울산/)) {
    return Region.ULSAN;
  }
  if (address.match(/^대전/)) {
    return Region.DAEJEON;
  }
  if (address.match(/^대구/)) {
    return Region.DAEGU;
  }
  if (address.match(/^광주/)) {
    return Region.GWANGJU;
  }
  if (address.match(/^세종/)) {
    return Region.SEJONG;
  }
  if (address.match(/^경기/)) {
    return Region.GYEONGGI;
  }
  if (address.match(/^강원/)) {
    return Region.GANGWON;
  }
  if (address.match(/^[전라북도|전북]/)) {
    return Region.NORTHERN_JEOLLA;
  }
  if (address.match(/^[전라남도|전남]/)) {
    return Region.SOUTHERN_JEOLLA;
  }
  if (address.match(/^[경상북도|경북]/)) {
    return Region.NORTHERN_GYEONGSANG;
  }
  if (address.match(/^[경상남도|경남]/)) {
    return Region.SOUTHERN_GYEONGSANG;
  }
  if (address.match(/^[충청북도|충북]/)) {
    return Region.NORTHERN_CHUNGCHEONG;
  }
  if (address.match(/^[충청남도|충남]/)) {
    return Region.SOUTHERN_CHUNGCHEONG;
  }
  if (address.match(/^제주/)) {
    return Region.JEJU;
  }

  return Region.OVERSEAS;
};
