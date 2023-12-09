import { SocketIoJwtMiddleware } from 'src/websockets/socketio-jwt.middleware';
import { SocketIoJwtGuard } from 'src/websockets/socketio-jwt.guard';
import { Logger, UseGuards } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

interface IMessage {
  sender: string;
  message: string;
  room: string;
}

//? references)
//? https://github.com/brianjohnsonsr/nest.ws.tutorial
//? or `build a websockets server` on youtube
@WebSocketGateway({ namespace: 'chat' })
// @UseGuards(SocketIoJwtGuard)
export class SocketIoGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private logger: Logger = new Logger('WebSocketGateway');

  @WebSocketServer()
  server: Server;

  afterInit(client: Socket) {
    this.logger.log('chat gateway initialized');
    // client.use(SocketIoJwtMiddleware() as any);
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log('client disconnected', client.id);
  }

  handleDisconnect(client: Socket) {
    this.logger.log('client connected', client.id);
  }

  // JFYI, this is equivalent to the following handler
  // handleMessage(@MessageBody() message: string): WsResponse<string> {
  //  return { event: 'chatToClient', data: payload };
  // }
  @SubscribeMessage(`chatToServer`)
  handleMessage(client: Socket, payload: IMessage): void {
    this.server.to(payload.room).emit('chatToClient', payload);
  }

  // as opposed to namespace, which a client can detect its connection,
  // room is different in that only server knows about which client has
  // joined the room or not. therefore, server needs to inform client(s)
  // which one has joined the room everytime things changed.
  @SubscribeMessage(`joinRoom`)
  handleJoinRoom(client: Socket, room: string): void {
    client.join(room);
    client.emit('joinedRoom', room);
  }

  @SubscribeMessage(`leaveRoom`)
  handleLeaveRoom(client: Socket, room: string): void {
    client.leave(room);
    client.emit('leftRoom', room);
  }
}
