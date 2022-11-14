import { Iconv } from 'iconv';

export const convertEucKrToUtf8 = (val: string): string => {
  const iconv = new Iconv('euc-kr', 'utf-8//translit//ignore');

  return iconv.convert(val).toString();
};

export const convertUtf8ToEucKr = (val: string): string => {
  const iconv = new Iconv('utf-8', 'euc-kr');
  const buffer = iconv.convert(val);

  return buffer.toString('binary');
};
