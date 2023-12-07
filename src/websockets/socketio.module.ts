import { Module } from '@nestjs/common';
import { SocketIoGateway } from 'src/websockets/socketio.gateway';

@Module({
  providers: [SocketIoGateway],
  exports: [SocketIoGateway],
})
export class SocketIoModule {}
