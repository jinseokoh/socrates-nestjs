import { MessageType } from 'src/common/enums';

export interface IMessageKey {
  meetupId: number; // partition key
  id: string | null; // sort key
}

export interface IMessage extends IMessageKey {
  userId: number;
  messageType: MessageType;
  message: string;
  createdAt?: number;
  updatedAt?: number;
}
