import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from 'src/domain/articles/article.entity';
import { AuctionsModule } from 'src/domain/auctions/auctions.module';
import { PackAuctionsController } from 'src/domain/packs/pack-auctions.controller';
import { PacksController } from 'src/domain/packs/packs.controller';
import { PacksService } from 'src/domain/packs/packs.service';
import { RelatedPacksController } from 'src/domain/packs/related-packs.controller';
import { Artist } from '../artists/artist.entity';
import { Auction } from '../auctions/auction.entity';
import { Pack } from './pack.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([Pack, Auction, Artist, Article]),
    AuctionsModule,
  ],
  providers: [PacksService],
  controllers: [
    PacksController,
    PackAuctionsController,
    RelatedPacksController,
  ],
})
export class PacksModule {}
