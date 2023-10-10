import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Sse,
} from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { ApiOperation } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { IMessageEvent } from 'src/common/interfaces';
import { CreateMessageDto } from 'src/domain/chats/dto/create-message.dto';
import {
  IMessage,
  IMessageKey,
} from 'src/domain/chats/entities/message.interface';
import { MessagesService } from 'src/domain/chats/messages.service';
import { SseService } from 'src/services/sse/sse.service';

@Controller('rooms')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly sseService: SseService,
  ) {}

  //?-------------------------------------------------------------------------//
  //? SSE
  //?-------------------------------------------------------------------------//

  @EventPattern('sse.chat')
  handleSseComments(data: any): void {
    this.sseService.fire(data.key, data.value);
  }

  @Public()
  @Sse(':id/messages/stream')
  sse(): Observable<IMessageEvent> {
    return this.sseService.sseStream$;
  }

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Message 생성' })
  @Post(':id/messages')
  async create(
    @CurrentUserId() id: string,
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<IMessage> {
    console.log(createMessageDto);
    return await this.messagesService.create(createMessageDto);
  }

  @ApiOperation({ description: 'Message 리스트' })
  @Get(':id')
  async fetch(
    @Param('id', ParseIntPipe) meetupId: number, // meetupId
    @Query('lastId') lastId: string | undefined,
  ): Promise<any> {
    const lastKey = lastId
      ? {
          meetupId,
          id: lastId,
        }
      : null;

    console.log(`lastId`, lastId, `lastKey`, lastKey); // todo. remove this log
    const res = await this.messagesService.fetch(meetupId, lastKey);
    console.log(`res`, res); // todo. remove this log

    return {
      lastKey: res.lastKey,
      count: res.count,
      items: res,
    };
  }

  @ApiOperation({ description: 'Message 삭제' })
  @Delete(':id')
  async delete(@Body() dto: IMessageKey): Promise<any> {
    await this.messagesService.delete(dto);
    return {
      data: 'ok',
    };
  }
}
