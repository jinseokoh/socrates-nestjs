import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Artist } from 'src/domain/artists/artist.entity';
import { Auction } from 'src/domain/auctions/auction.entity';
import { Profile } from 'src/domain/profiles/profile.entity';
import { UserAuctionsController } from 'src/domain/users/user-auctions.controller';
import { User } from 'src/domain/users/user.entity';
import { UsersController } from 'src/domain/users/users.controller';
import { UsersService } from 'src/domain/users/users.service';
import { S3Module } from 'src/services/aws/s3.module';
import { NaverModule } from 'src/services/naver/naver.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Auction, Artist, Profile]),
    S3Module,
    NaverModule,
  ],
  exports: [UsersService],
  providers: [UsersService],
  controllers: [UsersController, UserAuctionsController],
})
export class UsersModule {}
