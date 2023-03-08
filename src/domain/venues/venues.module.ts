import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Venue } from 'src/domain/venues/entities/venue.entity';
import { VenuesController } from 'src/domain/venues/venues.controller';
import { VenuesService } from 'src/domain/venues/venues.service';
@Module({
  imports: [TypeOrmModule.forFeature([Venue])],
  providers: [VenuesService],
  controllers: [VenuesController],
})
export class VenuesModule {}
