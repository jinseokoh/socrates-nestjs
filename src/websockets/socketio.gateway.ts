import { SocketIoJwtMiddleware } from 'src/websockets/socketio-jwt.middleware';
import { SocketIoJwtGuard } from 'src/websockets/socketio-jwt.guard';
import { Logger, UseGuards } from '@nestjs/common';
import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: 'chat' })
@UseGuards(SocketIoJwtGuard) // no quite valid here.
export class SocketIoGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private logger: Logger = new Logger('WebSocketGateway');

  @WebSocketServer()
  server: Server;

  afterInit(client: Socket) {
    this.logger.log('initialized');
    client.use(SocketIoJwtMiddleware() as any);
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log('client disconnected', client.id);
  }

  handleDisconnect(client: Socket) {
    this.logger.log('client connected', client.id);
  }

  // JFYI, this is equivalent to the following handler
  // handleMessage(@MessageBody() message: string): void {
  //  this.server.emit(`messageToClient`, message);
  // }
  @SubscribeMessage(`messageToServer`)
  handleMessage(client: Socket, payload: any): WsResponse<string> {
    //! send to the specific client, client.emit('messageToClient', ...)
    //! send to everyone on server, this.server.emit('messageToClient', ...)
    return { event: 'messageToClient', data: payload };
  }

  sendMessage() {
    this.server.emit('newMessage', 'hello from the server');
  }
}
