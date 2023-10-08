import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { Room } from 'src/domain/rooms/entities/room.entity';
import { RoomsController } from 'src/domain/rooms/rooms.controller';
import { RoomsService } from 'src/domain/rooms/rooms.service';
@Module({
  imports: [TypeOrmModule.forFeature([Room, Meetup])],
  providers: [RoomsService],
  controllers: [RoomsController],
})
export class RoomsModule {}
