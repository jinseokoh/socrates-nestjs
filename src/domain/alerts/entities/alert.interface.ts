import { AlertType } from 'src/common/enums';

export interface IAlertKey {
  userId: number; // partition key
  id: string | null; // sort key
}

export interface ISender {
  username: string;
  avatar: string;
  gender: 'male' | 'female' | null;
  userId: number;
  age: number | null;
}

export interface IAlert extends IAlertKey {
  alertType: AlertType;
  message: string | null;
  link: string | null;
  user: ISender | null;
  expires?: number;
  createdAt?: number;
  updatedAt?: number;
}
