import { Injectable } from '@nestjs/common';
import { Chat } from 'src/domain/chats/chat.entity';
import { CreateChatDto } from 'src/domain/chats/dto/create-chat.dto';

@Injectable()
export class ChatsService {
  messages: Chat[] = [{ name: 'chuck', text: 'Hello' }];
  clientToUser = {};

  create(createChatDto: CreateChatDto, clientId: string) {
    const message = {
      name: this.clientToUser[clientId],
      text: createChatDto.text,
    };
    this.messages.push(message);
    return message;
  }

  findAll() {
    return this.messages;
  }

  remove(id: number) {
    return `This action removes a #${id} message`;
  }

  identify(name: string, clientId: string) {
    this.clientToUser[clientId] = name;
    return Object.values(this.clientToUser);
  }

  getClientNameById(clientId: string) {
    return this.clientToUser[clientId];
  }
}
