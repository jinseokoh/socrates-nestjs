import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { CreateMessageDto } from 'src/domain/chats/dto/create-message.dto';
import {
  IMessage,
  IMessageKey,
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
  ): Promise<IMessage> {
    return await this.messagesService.create(createMessageDto);
  }

  @ApiOperation({ description: 'Message 리스트' })
  @Get(':id')
  async fetch(
    @Param('id', ParseIntPipe) id: number,
    @Query('lastId') lastId: string | undefined,
  ): Promise<any> {
    const lastKey = lastId
      ? {
          meetupId: id,
          id: lastId,
        }
      : null;
    const res = await this.messagesService.fetch(id, lastKey);
    console.log(`res`, res);

    return {
      lastKey: res.lastKey,
      count: res.count,
      items: res,
    };
  }

  @ApiOperation({ description: 'Message 삭제' })
  @Delete()
  async delete(@Body() body: IMessageKey): Promise<any> {
    const res = await this.messagesService.delete(body);
    return {
      data: res,
    };
  }
}
