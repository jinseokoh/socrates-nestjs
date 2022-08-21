import { extname } from 'path';
import { v4 } from 'uuid';

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

export const randomName = (prefix: string): string => {
  const ids = v4().split('-');

  return `${prefix}-${ids[1]}-${ids[2]}-${ids[3]}.jpg`;
};
