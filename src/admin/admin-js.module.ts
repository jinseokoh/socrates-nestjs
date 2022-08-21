import { AdminModule } from '@adminjs/nestjs';
import uploadFileFeature from '@adminjs/upload';
import { Module } from '@nestjs/common';
import { AvatarProvider } from 'src/admin/features/avatar.provider';
import { Article } from 'src/domain/articles/article.entity';
import { Artist } from 'src/domain/artists/artist.entity';
import { Artwork } from 'src/domain/artworks/artwork.entity';
import { Auction } from 'src/domain/auctions/auction.entity';
import { Bid } from 'src/domain/bids/bid.entity';
import { Coupon } from 'src/domain/coupons/coupon.entity';
import { Follow } from 'src/domain/follows/follow.entity';
import { Hashtag } from 'src/domain/hashtags/hashtag.entity';
import { News } from 'src/domain/news/news.entity';
import { Pack } from 'src/domain/packs/pack.entity';
import { Profile } from 'src/domain/profiles/profile.entity';
import { Provider } from 'src/domain/providers/provider.entity';
import { User } from 'src/domain/users/user.entity';
import { randomName } from 'src/helpers/random-filename';

@Module({
  imports: [
    AdminModule.createAdmin({
      adminJsOptions: {
        rootPath: '/admin',
        branding: {
          companyName: 'Flea Auction 관리자',
          logo: false,
        },
        resources: [
          {
            resource: Article,
            options: {
              properties: {
                body: { type: 'richtext' },
              },
            },
          },
          {
            resource: Artist,
            options: {
              properties: {
                credentials: { type: 'richtext' },
              },
            },
          },
          {
            resource: Artwork,
            options: {
              properties: {
                body: { type: 'richtext' },
              },
            },
          },
          Auction,
          { resource: Bid, options: { parent: Auction } },
          Coupon,
          Follow,
          Hashtag,
          {
            resource: News,
            options: {
              properties: {
                body: { type: 'richtext' },
              },
            },
          },
          Pack,
          { resource: Profile, options: { parent: User } },
          { resource: Provider, options: { parent: User } },
          {
            resource: User,
            features: [
              uploadFileFeature({
                provider: new AvatarProvider({
                  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                  region: process.env.AWS_DEFAULT_REGION,
                  bucket: process.env.AWS_BUCKET_NAME,
                }),
                properties: {
                  key: 'avatar',
                },
                uploadPath: (record, _filename) => {
                  const path = `local/users/${record.id()}/${randomName(
                    'avatar',
                  )}`;
                  return `${process.env.AWS_CLOUDFRONT_URL}/${path}`;
                },
              }),
            ],
          },
        ],
      },
      auth: {
        authenticate: async (email, password) =>
          Promise.resolve({ email: 'test' }),
        cookieName: 'test',
        cookiePassword: 'test',
      },
    }),
  ],
})
export class AdminJsModule {}
