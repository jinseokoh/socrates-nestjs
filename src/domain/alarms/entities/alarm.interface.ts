import { AlarmType } from 'src/common/enums';

export interface IAlarmKey {
  userId: number; // partition key
  id: string | null; // sort key
}

export interface IData {
  page: string;
  args: string;
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
  message: string;
  data: IData;
  link: string | null;
  user: ISender | null;
  isRead: boolean;
  expires?: number;
  createdAt?: number;
  updatedAt?: number;
}
