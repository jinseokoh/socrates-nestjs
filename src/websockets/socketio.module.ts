import { Module } from '@nestjs/common';
import { ChatsModule } from 'src/domain/chats/chats.module';
import { MessagesService } from 'src/domain/chats/messages.service';
import { SocketIoGateway } from 'src/websockets/socketio.gateway';

@Module({
  providers: [SocketIoGateway],
  exports: [SocketIoGateway],
})
export class SocketIoModule {}
