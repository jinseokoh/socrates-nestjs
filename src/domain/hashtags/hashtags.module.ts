import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HashtagArtworksController } from 'src/domain/hashtags/hashtag-artworks.controller';
import { HashtagsController } from 'src/domain/hashtags/hashtags.controller';
import { HashtagsService } from 'src/domain/hashtags/hashtags.service';
import { Artwork } from '../artworks/artwork.entity';
import { Hashtag } from './hashtag.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Hashtag, Artwork])],
  providers: [HashtagsService],
  controllers: [HashtagsController, HashtagArtworksController],
})
export class HashtagsModule {}
