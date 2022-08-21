import { Module } from '@nestjs/common';
import { ChatsGateway } from 'src/domain/chats/chats.gateway';
import { ChatsService } from 'src/domain/chats/chats.service';
@Module({
  providers: [ChatsGateway, ChatsService],
})
export class ChatsModule {}
