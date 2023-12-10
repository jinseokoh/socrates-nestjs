import { SocketIoJwtMiddleware } from 'src/websockets/socketio-jwt.middleware';
import { SocketIoJwtGuard } from 'src/websockets/socketio-jwt.guard';
import { Logger, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import { MessagesService } from 'src/domain/chats/messages.service';
import { CreateMessageDto } from 'src/domain/chats/dto/create-message.dto';

//? references #1)
//? https://github.com/brianjohnsonsr/nest.ws.tutorial
//? or `build a websockets server` on youtube
//? reference #2) https://www.youtube.com/watch?v=atbdpX4CViM
@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: '*',
  },
})
// @UseGuards(SocketIoJwtGuard)
export class SocketIoGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private logger: Logger = new Logger('WebSocketGateway');

  constructor(private readonly messagesService: MessagesService) {}

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
  async handleMessage(client: Socket, chatUIMessage: any): Promise<void> {
    const room = client.handshake.query.room; // # meetupId

    console.log('~~~~~~~~~~~~~~~~~~~~~~~~');
    console.log(chatUIMessage);
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~');
    // const message = await this.messagesService.create(dto);

    // send message payload back to clients
    this.server.to(`${room}`).emit('chatToClient', chatUIMessage);
  }

  // as opposed to namespace, which a client can detect its connection,
  // room is different in that only server knows about which client has
  // joined the room or not. therefore, server needs to inform client(s)
  // which one has joined the room everytime things changed.
  @SubscribeMessage(`joinRoom`)
  handleJoinRoom(
    client: Socket,
    data: { room: string; username: string },
  ): void {
    client.join(data.room);
    this.server.to(data.room).emit('joinedRoom', data.username);
  }

  @SubscribeMessage(`leaveRoom`)
  handleLeaveRoom(
    client: Socket,
    data: { room: string; username: string },
  ): void {
    client.leave(data.room);
    this.server.to(data.room).emit('leftRoom', data.username);
  }

  // @SubscribeMessage('createMessage')
  // async create(
  //   @MessageBody() createMessageDto: CreateMessageDto,
  //   @ConnectedSocket() client: Socket,
  // ) {
  //   const clientId = client.id;

  //   console.log(`clientId`, clientId);
  //   console.log('dto', createMessageDto);
  //   // const message = await this.messagesService.create(createMessageDto);
  //   console.log('message', message);
  //   this.server.emit('message', message);

  //   return message;
  // }

  // @SubscribeMessage('findAllMessages')
  // findAll(@MessageBody() key: IMessageKey) {
  //   return this.messagesService.fetch(key);
  // }

  // @SubscribeMessage('join')
  // joinRoom(
  //   @MessageBody('name') name: string,
  //   @ConnectedSocket() client: Socket,
  // ) {
  //   return this.messagesService.join(name, client.id);
  // }

  // @SubscribeMessage('typing')
  // typing(
  //   @MessageBody('isTyping') isTyping: boolean,
  //   @ConnectedSocket() client: Socket,
  // ) {
  //   const name = this.messagesService.getClientName(client.id);
  //   client.broadcast.emit('typing', { name, isTyping });
  // }
}
