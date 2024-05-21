import { extname } from 'path';
import { v4 } from 'uuid';
import * as moment from 'moment';

export const randomImage = (file: Express.Multer.File): string => {
  const ids = v4().split('-');
  const timestamp = Date.now();
  const ext = extname(file.originalname);

  return `${timestamp}-${ids[1]}-${ids[2]}-${ids[3]}${ext}`;
};

export const randomJpeg = (): string => {
  const ids = v4().split('-');
  const timestamp = Date.now();

  return `${timestamp}-${ids[1]}-${ids[2]}-${ids[3]}.jpg`;
};

export const randomName = (prefix: string, type = 'image/jpg'): string => {
  const ids = v4().split('-');
  const [key, val] = type.split('/');

  if (key === 'image' || key === 'video') {
    return `${prefix}-${ids[1]}-${ids[2]}-${ids[3]}.${val}`;
  }

  return `${prefix}-${ids[1]}-${ids[2]}-${ids[3]}`;
};

export const randomImageName = (prefix: string, type = 'image/jpg'): string => {
  const ids = v4().split('-');
  const timestamp = moment().format('YY-MM-DD-HH-mm-ss');
  const [key, val] = type.split('/');

  if (key === 'image' || key === 'video') {
    return `${prefix}-${timestamp}-${ids[1]}.${val}`;
  }

  return `${prefix}-${timestamp}-${ids[1]}`;
};
