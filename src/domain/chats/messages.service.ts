import { CreateMessageDto } from './dto/create-message.dto';
import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { SortOrder } from 'dynamoose/dist/General';
import { InjectModel, Model } from 'nestjs-dynamoose';
import { REDIS_PUBSUB_CLIENT } from 'src/common/constants';
import { SignedUrl } from 'src/common/types';
import { S3Service } from 'src/services/aws/s3.service';
import { UpdateMessageDto } from 'src/domain/chats/dto/update-message.dto';
import {
  IMessage,
  IMessageKey,
} from 'src/domain/chats/entities/message.interface';
import { randomImageName } from 'src/helpers/random-filename';
import * as moment from 'moment';
import { SignedUrlDto } from 'src/domain/users/dto/signed-url.dto';

const LIMIT = 10;

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel('Message')
    private readonly model: Model<IMessage, IMessageKey>,
    @Inject(REDIS_PUBSUB_CLIENT) private readonly redisClient: ClientProxy,
    private readonly s3Service: S3Service,
  ) {}

  //? notice that even if you provide createdAt and updatedAt in the payload
  //? dynamodb will ignore them and record the timestamps with its own value.
  //?
  async create(dto: CreateMessageDto): Promise<IMessage> {
    const timestampInMilliseconds = moment().valueOf();
    const id = `msg_${timestampInMilliseconds}_${dto.userId}`;
    //! as for the expiration, needs to be in seconds format (not milliseconds)
    const expires = moment().add(30, 'days').unix();
    try {
      const message = await this.model.create({ ...dto, id, expires });
      return message;
    } catch (error) {
      console.error(`[dynamodb] error`, error);
      throw new BadRequestException(error);
    }
  }

  //? notice that records will be sorted by range key, which is id
  //? (in msg_xx_## format string; xx is milliseconds ## is userId).
  //?
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

  //? ----------------------------------------------------------------------- //
  //? UPLOAD
  //? ----------------------------------------------------------------------- //

  // S3 직접 업로드를 위한 signedUrl 리턴
  async getSignedUrl(userId: number, dto: SignedUrlDto): Promise<SignedUrl> {
    const fileUri = randomImageName(dto.name ?? 'chat', dto.mimeType);
    const path = `${process.env.NODE_ENV}/chats/${userId}/${fileUri}`;
    const url = await this.s3Service.generateSignedUrl(path);

    return {
      upload: url,
      image: `https://cdn.mesoapp.kr/${path}`,
    };
  }
}
