import {
  BadRequestException,
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
import { SignedUrl } from 'src/common/types';
import { CreateMessageDto } from 'src/domain/chats/dto/create-message.dto';
import {
  IMessage,
  IMessageKey,
} from 'src/domain/chats/entities/message.interface';
import { MessagesService } from 'src/domain/chats/messages.service';
import { SseService } from 'src/services/sse/sse.service';

@Controller('chats')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly sseService: SseService,
  ) {}

  //?-------------------------------------------------------------------------//
  //? SSE
  //?-------------------------------------------------------------------------//

  @EventPattern('sse.add_chat')
  handleSseComments(data: any): void {
    // todo. record a footprint of data.meetupId to redis w/ timestamp
    // todo. check every once in a while to see if any stalled record exists
    // todo. call this.sseService.close(data.meetupId) to clean up
    this.sseService
      .for(data.meetupId)
      .fire(data.meetupId, 'sse.add_chat', data);
  }

  @Public()
  @Sse(':id/messages/stream')
  sse(@Param('id', ParseIntPipe) meetupId: number): Observable<IMessageEvent> {
    // console.log(`userId: ${id} meetupId: ${meetupId}`);
    return this.sseService.for(meetupId).streamz$[meetupId];
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
  @Get(':id/messages')
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

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Message 삭제' })
  @Delete(':id/messages')
  async delete(
    @Param('id', ParseIntPipe) meetupId: number, // meetupId
    @Body('id') id: string,
  ): Promise<any> {
    const key = {
      meetupId: meetupId,
      id: id,
    } as IMessageKey;

    console.log(key);
    await this.messagesService.delete(key);
    return {
      data: 'ok',
    };
  }

  //?-------------------------------------------------------------------------//
  //? UPLOAD
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 's3 직접 업로드를 위한 signedUrl 리턴' })
  @Post('image/url')
  async getSignedUrl(
    @CurrentUserId() id: number,
    @Body('mimeType') mimeType: string,
  ): Promise<SignedUrl> {
    if (mimeType) {
      return await this.messagesService.getSignedUrl(id, mimeType);
    }
    throw new BadRequestException('mimeType is missing');
  }
}
