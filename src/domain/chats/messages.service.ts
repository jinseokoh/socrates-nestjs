import { CreateMessageDto } from './dto/create-message.dto';
import { Injectable, BadRequestException } from '@nestjs/common';
import { SortOrder } from 'dynamoose/dist/General';
import * as moment from 'moment';
import { InjectModel, Model } from 'nestjs-dynamoose';
import { UpdateMessageDto } from 'src/domain/chats/dto/update-message.dto';
import {
  IMessage,
  IMessageKey,
} from 'src/domain/chats/entities/message.interface';

const LIMIT = 10;

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel('Message')
    private readonly model: Model<IMessage, IMessageKey>,
  ) {}

  async create(dto: CreateMessageDto): Promise<IMessage> {
    try {
      return this.model.create({
        ...dto,
        id: `msg_${moment().valueOf()}_${dto.userId}`,
      });
    } catch (error) {
      console.error(`[dynamodb] error`, error);
      throw new BadRequestException(error);
    }
  }

  async fetch(meetupId: number, lastKey: IMessageKey | null): Promise<any> {
    try {
      return lastKey
        ? await this.model
            .query('meetupId')
            .eq(meetupId)
            .sort(SortOrder.descending)
            .startAt(lastKey)
            .limit(LIMIT)
            .exec()
        : await this.model
            .query('meetupId')
            .eq(meetupId)
            .sort(SortOrder.descending)
            .limit(LIMIT)
            .exec();
    } catch (error) {
      console.error(`[dynamodb] error`, error);
      throw new BadRequestException(error);
    }
  }

  async findById(key: IMessageKey): Promise<IMessage> {
    try {
      return this.model.get(key);
    } catch (error) {
      console.error(`[dynamodb] error`, error);
      throw new BadRequestException(error);
    }
  }

  async update(key: IMessageKey, dto: UpdateMessageDto): Promise<IMessage> {
    try {
      return this.model.update(key, dto);
    } catch (error) {
      console.error(`[dynamodb] error`, error);
      throw new BadRequestException(error);
    }
  }

  async delete(key: IMessageKey): Promise<any> {
    try {
      return this.model.delete(key);
    } catch (error) {
      console.error(`[dynamodb] error`, error);
      throw new BadRequestException(error);
    }
  }
}
