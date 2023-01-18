import { Injectable } from '@nestjs/common';
import { Message } from 'src/domain/messages/entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  messages: Message[] = [{ name: 'Marius', text: 'hey' }];
  clientToUser = {};

  create(clientId: string, createMessageDto: CreateMessageDto) {
    const message = {
      name: this.clientToUser[clientId],
      text: createMessageDto.text,
    };
    this.messages.push(message);

    return message;
  }

  findAll() {
    return this.messages;
  }

  join(name: string, clientId: string) {
    this.clientToUser[clientId] = name;

    return Object.values(this.clientToUser); // list of names
  }

  getClientName(clientId: string) {
    return this.clientToUser[clientId];
  }
}
