import { CreateAlertDto } from './dto/create-alert.dto';
import { Injectable, BadRequestException } from '@nestjs/common';
import { SortOrder } from 'dynamoose/dist/General';
import { InjectModel, Model } from 'nestjs-dynamoose';
import { UpdateAlertDto } from 'src/domain/alerts/dto/update-alert.dto';
import { IAlert, IAlertKey } from 'src/domain/alerts/entities/alert.interface';
import * as moment from 'moment';

const LIMIT = 10;

@Injectable()
export class AlertsService {
  constructor(
    @InjectModel('Alert')
    private readonly model: Model<IAlert, IAlertKey>,
  ) {}

  //? notice that even if you provide createdAt and updatedAt in the payload
  //? dynamodb will ignore them and record the timestamps with its own value.
  //?
  async create(dto: CreateAlertDto): Promise<IAlert> {
    const timestampInMilliseconds = moment().valueOf();
    const id = `msg_${timestampInMilliseconds}`;
    //! as for the expiration, needs to be in seconds format (not milliseconds)
    const expires = moment().add(10, 'minutes').unix();
    try {
      const alert = await this.model.create({ ...dto, id, expires });
      return alert;
    } catch (error) {
      console.error(`[dynamodb] error`, error);
      throw new BadRequestException(error);
    }
  }

  //? notice that records will be sorted by range key, which is id
  //? (in msg_xx_## format string; xx is milliseconds).
  //?
  async fetch(userId: number, lastKey: IAlertKey | null): Promise<any> {
    try {
      return lastKey
        ? await this.model
            .query('userId')
            .eq(userId)
            .sort(SortOrder.descending)
            .startAt(lastKey)
            .limit(LIMIT)
            .exec()
        : await this.model
            .query('userId')
            .eq(userId)
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
}
