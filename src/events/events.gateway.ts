import { SocketIoJwtMiddleware } from './../domain/auth/guards/ws-jwt.middleware';
import { Logger, UseGuards } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import { SocketIoJwtGuard } from 'src/domain/auth/guards/ws-jwt.guard';

@WebSocketGateway({ namespace: 'events' })
// @UseGuards(SocketIoJwtGuard)
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  afterInit(client: Socket) {
    client.use(SocketIoJwtMiddleware() as any);
  }

  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): string {
    return 'Hello world!';
  }

  sendMessage() {
    this.server.emit('newMessage', 'hello from the server');
  }
}
