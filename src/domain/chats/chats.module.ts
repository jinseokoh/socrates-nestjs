import { RoomsController } from 'src/domain/chats/rooms.controller';
import { Module } from '@nestjs/common';
import { DynamooseModule } from 'nestjs-dynamoose';
import { MessagesController } from 'src/domain/chats/messages.controller';
import { MessagesService } from 'src/domain/chats/messages.service';
import { MessageSchema } from 'src/domain/chats/entities/message.schema';
import { SseModule } from 'src/services/sse/sse.module';
import { S3Module } from 'src/services/aws/s3.module';
import { RoomsService } from 'src/domain/chats/rooms.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from 'src/domain/chats/entities/room.entity';
import { RoomSubscriber } from 'src/domain/chats/subscribers/room-subscriber';
import { SocketIoGateway } from 'src/websockets/socketio.gateway';
// import { MessagesGateway } from 'src/domain/chats/messages.gateway';
// removed message gateway as we exploit SSE instead of websocket
@Module({
  imports: [
    TypeOrmModule.forFeature([Room]),
    DynamooseModule.forFeature([
      {
        name: 'Message',
        schema: MessageSchema,
        options: {
          tableName: 'message', // e.g. local_message_table
        },
      },
    ]),
    S3Module,
    SseModule,
  ],
  providers: [RoomsService, MessagesService, RoomSubscriber],
  controllers: [RoomsController, MessagesController],
  exports: [MessagesService],
})
export class ChatsModule {}
