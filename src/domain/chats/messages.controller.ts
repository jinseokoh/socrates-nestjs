import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { CreateMessageDto } from 'src/domain/chats/dto/create-message.dto';
import {
  IMessageKey,
  IMessageParams,
} from 'src/domain/chats/entities/message.interface';
import { MessagesService } from 'src/domain/chats/messages.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Message 생성' })
  @Post()
  async create(
    @CurrentUserId() id: string,
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<any> {
    return await this.messagesService.create(createMessageDto);
  }

  @ApiOperation({ description: 'Message 리스트' })
  @Get()
  async fetch(@Query() query: IMessageParams): Promise<any> {
    const lastKey = query.msid
      ? {
          room: query.room,
          msid: query.msid,
        }
      : null;
    const response = await this.messagesService.fetch(query.room, lastKey);

    return {
      lastKey: response.lastKey,
      count: response.count,
      items: response,
    };
  }

  @ApiOperation({ description: 'Message 삭제' })
  @Delete()
  async delete(@Body() body: IMessageKey): Promise<any> {
    await this.messagesService.delete(body);
    return {
      data: false,
    };
  }
}
