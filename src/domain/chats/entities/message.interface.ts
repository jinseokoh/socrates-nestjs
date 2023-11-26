import { MessageType } from 'src/common/enums';

export interface IMessageKey {
  meetupId: number; // partition key
  id: string | null; // sort key
}

export interface IImage {
  uri: string;
  size: number;
  width: number;
  height: number;
}

export interface IAppointment {
  dateTime: string;
  title: string;
  image: string;
  venueName: string;
  venueAddress: string;
  venueImage: string;
}

export interface IMessage extends IMessageKey {
  userId: number;
  messageType: MessageType;
  message: string | null;
  image: IImage | null;
  expires?: number;
  createdAt?: number;
  updatedAt?: number;
}
