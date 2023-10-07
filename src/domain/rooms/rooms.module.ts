import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from 'src/domain/rooms/entities/room.entity';
import { RoomsController } from 'src/domain/rooms/rooms.controller';
import { RoomsService } from 'src/domain/rooms/rooms.service';
@Module({
  imports: [TypeOrmModule.forFeature([Room])],
  providers: [RoomsService],
  controllers: [RoomsController],
})
export class RoomsModule {}
