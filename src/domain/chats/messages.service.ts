import { CreateMessageDto } from './dto/create-message.dto';
// src/user/user.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SortOrder } from 'dynamoose/dist/General';
import * as moment from 'moment';
import { InjectModel, Model } from 'nestjs-dynamoose';
import {
  IMessage,
  IMessageKey,
  IMessageParams,
} from 'src/domain/chats/entities/message.interface';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel('Message')
    private readonly model: Model<IMessage, IMessageKey>,
  ) {}

  async create(dto: CreateMessageDto): Promise<any> {
    const message = this.model.create({
      ...dto,
      msid: `${moment().valueOf()}`,
    });

    return message;
  }

  async fetch(room: string, lastKey: IMessageKey | null): Promise<any> {
    try {
      return await this.model
        .query('room')
        .eq(room)
        .sort(SortOrder.descending)
        .startAt(lastKey)
        .limit(10)
        .exec();
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(error);
    }
  }

  async fetchWithParams(params: IMessageParams): Promise<any> {
    try {
      return await this.model
        .query('room')
        .eq(params.room)
        .sort(SortOrder.descending)
        .startAt(null)
        .limit(10)
        .exec();
    } catch (error) {
      console.error(error);
      // throw new InternalServerErrorException(error);
    }
  }

  async delete(body: any): Promise<any> {
    try {
      return this.model.delete(body);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findById(key: IMessageKey): Promise<any> {
    try {
      return this.model.get(key);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
