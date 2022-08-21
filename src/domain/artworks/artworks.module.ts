import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArtistsModule } from 'src/domain/artists/artists.module';
import { ArtworkHashtagsController } from 'src/domain/artworks/artwork-hashtags.controller';
import { ArtworkUsersController } from 'src/domain/artworks/artwork-users.controller';
import { Artwork } from 'src/domain/artworks/artwork.entity';
import { ArtworksController } from 'src/domain/artworks/artworks.controller';
import { ArtworksService } from 'src/domain/artworks/artworks.service';
import { User } from 'src/domain/users/user.entity';
import { S3Module } from 'src/services/aws/s3.module';
@Module({
  imports: [TypeOrmModule.forFeature([Artwork, User]), S3Module, ArtistsModule],
  exports: [ArtworksService],
  providers: [ArtworksService],
  controllers: [
    ArtworksController,
    ArtworkUsersController,
    ArtworkHashtagsController,
  ],
})
export class ArtworksModule {}
