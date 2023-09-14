import * as admin from 'firebase-admin';
import { User } from 'src/domain/users/entities/user.entity';

export type FollowUser = { followable: boolean } & User;

export type FollowDetailUser = {
  followable: boolean;
  followerCount: number;
  followingCount: number;
} & User;

export type UploadedFile = {
  size: number;
  path: string;
  type: string;
  name: string | null;
};

export type SignedUrl = {
  upload: string;
  image: string;
};

export type AuctionItem = {
  auctionId: number;
  userId?: number;
};

export type FirebaseUser = admin.auth.DecodedIdToken;

export type StaleToken = {
  userId: number;
  pushToken: string;
};

export type NumberData = {
  data: number;
};

export type AnyData = {
  data: any;
};

export type Where = {
  room: string;
  msid?: string | null;
  size?: number | null;
};

export type Tokens = {
  accessToken: string;
  refreshToken: string;
  // accessTokenExpiry: number;
  // refreshTokenExpiry: number;
};
