import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArtworksModule } from 'src/domain/artworks/artworks.module';
import { AuctionUsersController } from 'src/domain/auctions/auction-users.controller';
import { AuctionsController } from 'src/domain/auctions/auctions.controller';
import { AuctionsService } from 'src/domain/auctions/auctions.service';
import { User } from '../users/user.entity';
import { Auction } from './auction.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Auction, User]), ArtworksModule],
  exports: [AuctionsService],
  providers: [AuctionsService],
  controllers: [AuctionsController, AuctionUsersController],
})
export class AuctionsModule {}
