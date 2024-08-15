import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import * as moment from 'moment';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { MessageType } from 'src/common/enums';
import { SignedUrl } from 'src/common/types';
import { CreateMessageDto } from 'src/domain/chats/dto/create-message.dto';
import {
  IMessage,
  IMessageKey,
} from 'src/domain/chats/entities/message.interface';
import { MessagesService } from 'src/domain/chats/messages.service';
import { RoomsService } from 'src/domain/chats/rooms.service';
import { SignedUrlDto } from 'src/domain/users/dto/signed-url.dto';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('chats')
export class MessagesController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly messagesService: MessagesService,
  ) {}

  //? ----------------------------------------------------------------------- //
  //? CREATE
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'Message 생성' })
  @Post(':roomId/messages')
  async create(
    @CurrentUserId() userId: number,
    @Param('roomId', ParseIntPipe) roomId: number,
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<IMessage> {
    if (createMessageDto.messageType === MessageType.CUSTOM) {
      const dt = moment.parseZone(createMessageDto.appointment.dateTime);
      // await this.roomsService.update({
      //   roomId: roomId,
      //   userId: userId,
      //   appointedAt: dt.toDate(),
      // });
    }
    return await this.messagesService.create(createMessageDto);
  }

  //? ----------------------------------------------------------------------- //
  //? READ
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'Message 리스트' })
  @Get(':roomId/messages')
  async fetch(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Query('lastId') lastId: string | undefined,
  ): Promise<any> {
    const lastKey = lastId
      ? {
          roomId,
          id: lastId,
        }
      : null;

    console.log(`lastId`, lastId, `lastKey`, lastKey); // todo. remove this log
    const res = await this.messagesService.fetch(roomId, lastKey);
    console.log(`res`, res); // todo. remove this log

    return {
      lastKey: res.lastKey,
      count: res.count,
      items: res,
    };
  }

  //? ----------------------------------------------------------------------- //
  //? DELETE
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'Message 삭제' })
  @Delete(':roomId/messages')
  async delete(
    @Param('roomId', ParseIntPipe) roomId: number, // roomId
    @Body('id') id: string,
  ): Promise<any> {
    const key = {
      roomId: roomId,
      id: id,
    } as IMessageKey;

    console.log(key);
    await this.messagesService.delete(key);
    return {
      data: 'ok',
    };
  }

  //? ----------------------------------------------------------------------- //
  //? UPLOAD
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 's3 직접 업로드를 위한 signedUrl 리턴' })
  @Post('upload-url')
  async getSignedUrl(
    @CurrentUserId() userId: number,
    @Body() dto: SignedUrlDto,
  ): Promise<SignedUrl> {
    return await this.messagesService.getSignedUrl(userId, dto);
  }
}
