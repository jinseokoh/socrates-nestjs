export interface IUser {
  id: string;
  username: string;
  avatar: string;
}

// to query only
export interface IMessageParams {
  room: string;
  msid: string | null;
}

export interface IMessageKey {
  room: string;
  msid: string;
}

export interface IMessage extends IMessageKey {
  user: IUser;
  text: string;
  type: string;
  createdAt?: string;
}
