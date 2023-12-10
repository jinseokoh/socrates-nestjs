import { Module } from '@nestjs/common';
import { ChatsModule } from 'src/domain/chats/chats.module';
import { SocketIoGateway } from 'src/websockets/socketio.gateway';

@Module({
  providers: [SocketIoGateway],
  imports: [ChatsModule],
  exports: [SocketIoGateway],
})
export class SocketIoModule {}
