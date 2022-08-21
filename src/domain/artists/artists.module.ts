import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArtistsController } from 'src/domain/artists/artists.controller';
import { ArtistsService } from 'src/domain/artists/artists.service';
import { UsersModule } from 'src/domain/users/users.module';
import { Artist } from './artist.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Artist]), UsersModule],
  exports: [ArtistsService],
  providers: [ArtistsService],
  controllers: [ArtistsController],
})
export class ArtistsModule {}
