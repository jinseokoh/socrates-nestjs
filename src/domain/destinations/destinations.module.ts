import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DestinationsController } from 'src/domain/destinations/destinations.controller';
import { DestinationsService } from 'src/domain/destinations/destinations.service';
import { UserDestinationsController } from 'src/domain/users/user-destinations.controller';
import { User } from 'src/domain/users/user.entity';
import { Destination } from './destination.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Destination])],
  // exports: [DestinationsService],
  providers: [DestinationsService],
  controllers: [DestinationsController, UserDestinationsController],
})
export class DestinationsModule {}
