import { AlarmType } from 'src/common/enums';

export interface IAlarmKey {
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

export interface IAlarm extends IAlarmKey {
  alarmType: AlarmType;
  message: string | null;
  link: string | null;
  user: ISender | null;
  expires?: number;
  createdAt?: number;
  updatedAt?: number;
}
