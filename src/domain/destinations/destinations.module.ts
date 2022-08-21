import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DestinationsController } from 'src/domain/destinations/destinations.controller';
import { DestinationsService } from 'src/domain/destinations/destinations.service';
import { Destination } from './destination.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Destination])],
  providers: [DestinationsService],
  controllers: [DestinationsController],
})
export class DestinationsModule {}
