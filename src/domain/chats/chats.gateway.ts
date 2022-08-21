import { Logger } from '@nestjs/common';
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
import { ChatsService } from 'src/domain/chats/chats.service';
import { CreateChatDto } from 'src/domain/chats/dto/create-chat.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  private readonly logger = new Logger(ChatsGateway.name);

  constructor(private readonly chatsService: ChatsService) {}

  //** OnGatewayInit
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  afterInit(_server: any) {
    this.logger.debug('socket.io initialized.');
  }

  //** OnGatewayConnection
  handleConnection(client: Socket) {
    this.logger.debug(
      `${client.id}(${client.handshake.query['username']}) is connected!`,
    );

    this.server.emit('msgToClient', {
      name: `admin`,
      text: `join chat.`,
    });
  }

  //** OnGatewayDisconnect
  handleDisconnect(client: Socket) {
    this.logger.debug(`${client.id} is disconnected.`);
  }

  @SubscribeMessage('createMessage')
  async create(
    @MessageBody() createChatDto: CreateChatDto,
    @ConnectedSocket() client: Socket,
  ) {
    const message = await this.chatsService.create(createChatDto, client.id);
    this.server.emit('message', message);
    return message;
  }

  @SubscribeMessage('findAllMessages')
  findAll() {
    return this.chatsService.findAll();
  }

  @SubscribeMessage('join')
  join(@MessageBody('name') name: string, @ConnectedSocket() client: Socket) {
    return this.chatsService.identify(name, client.id);
  }

  @SubscribeMessage('typing')
  typing(
    @MessageBody('isTyping') isTyping: boolean,
    @ConnectedSocket() client: Socket,
  ) {
    const name = this.chatsService.getClientNameById(client.id);
    client.broadcast.emit('typing', { name, isTyping });
  }

  @SubscribeMessage('removeMessage')
  remove(@MessageBody() id: number) {
    return this.chatsService.remove(id);
  }
}
