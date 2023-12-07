import { SocketIoJwtMiddleware } from 'src/websockets/socketio-jwt.middleware';
import { SocketIoJwtGuard } from 'src/websockets/socketio-jwt.guard';
import { Logger, UseGuards } from '@nestjs/common';
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: 'chat' })
@UseGuards(SocketIoJwtGuard) // no quite valid here.
export class SocketIoGateway {
  @WebSocketServer()
  server: Server;

  afterInit(client: Socket) {
    client.use(SocketIoJwtMiddleware() as any);
  }

  // JFYI, if you need to access client use the following form
  // handleMessage(client: any, payload: any): string {
  //  return 'Hello world!';
  // }
  @SubscribeMessage(`message`)
  handleMessage(@MessageBody() message: string): void {
    // every one on the server
    this.server.emit(`message`, message);
  }

  sendMessage() {
    this.server.emit('newMessage', 'hello from the server');
  }
}
