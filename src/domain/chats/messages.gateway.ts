import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CreateMessageDto } from 'src/domain/chats/dto/create-message.dto';
import { MessagesService } from 'src/domain/chats/messages.service';
import { IMessageParams } from './entities/message.interface';

// reference) https://www.youtube.com/watch?v=atbdpX4CViM
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MessagesGateway {
  @WebSocketServer()
  server: Server; // a reference to the socket.io server under the hood.
  private readonly logger = new Logger(MessagesGateway.name);
  constructor(private readonly messagesService: MessagesService) {}

  @SubscribeMessage('createMessage')
  async create(
    @MessageBody() createMessageDto: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const clientId = client.id;

    console.log(`clientId`, clientId);
    console.log('dto', createMessageDto);
    const message = await this.messagesService.create(createMessageDto);
    console.log('message', message);
    this.server.emit('message', message);

    return message;
  }

  @SubscribeMessage('findAllMessages')
  findAll(@MessageBody() params: IMessageParams) {
    return this.messagesService.fetchWithParams(params);
  }

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
