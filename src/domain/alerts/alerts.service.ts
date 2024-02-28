import { CreateAlertDto } from './dto/create-alert.dto';
import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { SortOrder } from 'dynamoose/dist/General';
import { InjectModel, Model } from 'nestjs-dynamoose';
import { REDIS_PUBSUB_CLIENT } from 'src/common/constants';
import { SignedUrl } from 'src/common/types';
import { S3Service } from 'src/services/aws/s3.service';
import { UpdateAlertDto } from 'src/domain/alerts/dto/update-alert.dto';
import { IAlert, IAlertKey } from 'src/domain/alerts/entities/alert.interface';
import { randomName } from 'src/helpers/random-filename';
import * as moment from 'moment';

const LIMIT = 10;

@Injectable()
export class AlertsService {
  constructor(
    @InjectModel('Alert')
    private readonly model: Model<IAlert, IAlertKey>,
    @Inject(REDIS_PUBSUB_CLIENT) private readonly redisClient: ClientProxy,
    private readonly s3Service: S3Service,
  ) {}

  //?
  //? notice that even if you provide createdAt and/or updatedAt in the payload
  //? dynamodb will ignore them and timestamp the record with its own value.
  //?
  async create(dto: CreateAlertDto): Promise<IAlert> {
    const createdAt = !dto.createdAt ? moment().valueOf() : dto.createdAt;
    const id = !dto.id ? `msg_${createdAt}_${dto.userId}` : dto.id;
    const expires = moment().add(10, 'minutes').unix(); // unix timestamp in seconds!
    try {
      const alert = await this.model.create({ ...dto, id, expires });
      return alert;
    } catch (error) {
      console.error(`[dynamodb] error`, error);
      throw new BadRequestException(error);
    }
  }

  //?
  //? notice that records will be sorted by range key, which, in this case, is
  //? id, the string value.
  //?
  async fetch(meetupId: number, lastKey: IAlertKey | null): Promise<any> {
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

  async findById(key: IAlertKey): Promise<IAlert> {
    try {
      return this.model.get(key);
    } catch (error) {
      console.error(`[dynamodb] error`, error);
      throw new BadRequestException(error);
    }
  }

  async update(key: IAlertKey, dto: UpdateAlertDto): Promise<IAlert> {
    try {
      return this.model.update(key, dto);
    } catch (error) {
      console.error(`[dynamodb] error`, error);
      throw new BadRequestException(error);
    }
  }

  async delete(key: IAlertKey): Promise<any> {
    try {
      return this.model.delete(key);
    } catch (error) {
      console.error(`[dynamodb] error`, error);
      throw new BadRequestException(error);
    }
  }

  //?-------------------------------------------------------------------------//
  //? UPLOAD
  //?-------------------------------------------------------------------------//

  // S3 직접 업로드를 위한 signedUrl 리턴
  async getSignedUrl(
    userId: number,
    mimeType = 'image/jpeg',
  ): Promise<SignedUrl> {
    const fileUri = randomName('chat', mimeType);
    const path = `${process.env.NODE_ENV}/filez/${userId}/${fileUri}`;
    const url = await this.s3Service.generateSignedUrl(path);

    return {
      upload: url,
      image: `https://cdn.fleaauction.world/${path}`,
    };
  }
}
