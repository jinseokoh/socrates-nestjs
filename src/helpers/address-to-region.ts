import { RegionEnum } from 'src/common/enums';

export const addressToRegionEnum = (address: string): RegionEnum => {
  if (address.match(/^서울/)) {
    return RegionEnum.SEOUL;
  }
  if (address.match(/^부산/)) {
    return RegionEnum.BUSAN;
  }
  if (address.match(/^인천/)) {
    return RegionEnum.INCHEON;
  }
  if (address.match(/^울산/)) {
    return RegionEnum.ULSAN;
  }
  if (address.match(/^대전/)) {
    return RegionEnum.DAEJEON;
  }
  if (address.match(/^대구/)) {
    return RegionEnum.DAEGU;
  }
  if (address.match(/^광주/)) {
    return RegionEnum.GWANGJU;
  }
  if (address.match(/^세종/)) {
    return RegionEnum.SEJONG;
  }
  if (address.match(/^경기/)) {
    return RegionEnum.GYEONGGI;
  }
  if (address.match(/^강원/)) {
    return RegionEnum.GANGWON;
  }
  if (address.match(/^[전라북도|전북]/)) {
    return RegionEnum.NORTHERN_JEOLLA;
  }
  if (address.match(/^[전라남도|전남]/)) {
    return RegionEnum.SOUTHERN_JEOLLA;
  }
  if (address.match(/^[경상북도|경북]/)) {
    return RegionEnum.NORTHERN_GYEONGSANG;
  }
  if (address.match(/^[경상남도|경남]/)) {
    return RegionEnum.SOUTHERN_GYEONGSANG;
  }
  if (address.match(/^[충청북도|충북]/)) {
    return RegionEnum.NORTHERN_CHUNGCHEONG;
  }
  if (address.match(/^[충청남도|충남]/)) {
    return RegionEnum.SOUTHERN_CHUNGCHEONG;
  }

  return RegionEnum.JEJU;
};
