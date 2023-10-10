import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from 'src/domain/chats/entities/room.entity';
import { RoomsController } from 'src/domain/chats/rooms.controller';
import { RoomsService } from 'src/domain/chats/rooms.service';
@Module({
  imports: [TypeOrmModule.forFeature([Room])],
  providers: [RoomsService],
  controllers: [RoomsController],
})
export class RoomsModule {}
