import { Module } from '@nestjs/common';
import { DynamooseModule } from 'nestjs-dynamoose';
import { MessagesController } from 'src/domain/chats/messages.controller';
import { MessagesService } from 'src/domain/chats/messages.service';
import { MessageSchema } from 'src/domain/chats/entities/message.schema';
// import { MessagesGateway } from 'src/domain/chats/messages.gateway';

@Module({
  imports: [
    DynamooseModule.forFeature([
      {
        name: 'Message',
        schema: MessageSchema,
        options: {
          tableName: 'message',
        },
      },
    ]),
  ],
  controllers: [MessagesController],
  providers: [/* MessagesGateway */ MessagesService],
})
export class MessagesModule {}
