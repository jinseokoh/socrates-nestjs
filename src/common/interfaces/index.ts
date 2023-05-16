export interface IDatabaseConfig {
  engine: string;
  host: string;
  port: number;
  username: string;
  password: string;
  dbname: string;
}
export interface IRmqConfig {
  user: string;
  password: string;
  host: string;
  queue: string;
}
export interface IRedisConfig {
  host: string;
  port: number;
}
export interface IJwtConfig {
  authSecret: string;
  refreshSecret: number;
}
export interface IGoogleConfig {
  clientId: string;
  secret: string;
}
export interface IFirebaseConfig {
  projectId: string;
  privateKey: string;
  clientEmail: string;
}
export interface IAwsConfig {
  accessKey: string;
  secretAccessKey: string;
  defaultRegion: string;
  bucketName: string;
  cloudFrontUrl: string;
  dbSecretsArn: string;
}
export interface INaverConfig {
  accessKey: string;
  secretKey: string;
  smsServiceId: string;
  smsSecretKey: string;
  smsPhoneNumber: string;
  alimtalkServiceId: string;
  plusFriendId: string;
}
export interface IIamportConfig {
  merchantId: string;
  apiKey: string;
  apiSecret: string;
}
export interface IMessageEvent {
  data: string | object;
  id?: string;
  type?: string;
  retry?: number;
}
export interface IKeyVal {
  key: string;
  val: string;
}
export interface IPackCompositeIds {
  artistId: number;
  artworkIds: number[];
}

export interface IAuthor {
  id: string;
  username: string;
  avatar: string | null;
}

// export interface IFcmTokenPayload {
//   tokens: string[];
//   title: string;
//   body: string;
//   url: string;
//   silent: boolean;
// }

// export interface IFcmTopicPayload {
//   topic: string;
//   title: string;
//   body: string;
//   url: string;
//   silent: boolean;
// }
