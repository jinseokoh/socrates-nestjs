import { CreateAlarmDto } from './dto/create-alarm.dto';
import { Injectable, BadRequestException } from '@nestjs/common';
import { SortOrder } from 'dynamoose/dist/General';
import { InjectModel, Model } from 'nestjs-dynamoose';
import { UpdateAlarmDto } from 'src/domain/alarms/dto/update-alarm.dto';
import { IAlarm, IAlarmKey } from 'src/domain/alarms/entities/alarm.interface';
import * as moment from 'moment';

const LIMIT = 10;

@Injectable()
export class AlarmsService {
  constructor(
    @InjectModel('Alarm')
    private readonly model: Model<IAlarm, IAlarmKey>,
  ) {}

  //? notice that even if you provide createdAt and updatedAt in the payload
  //? dynamodb will ignore them and record the timestamps with its own value.
  //?
  async create(dto: CreateAlarmDto): Promise<IAlarm> {
    const timestampInMilliseconds = moment().valueOf();
    const id = `msg_${timestampInMilliseconds}`;
    //! as for the expiration, needs to be in seconds format (not milliseconds)
    const expires = moment().add(2, 'days').unix();
    try {
      const alarm = await this.model.create({ ...dto, id, expires });
      return alarm;
    } catch (error) {
      console.error(`[dynamodb] error`, error);
      throw new BadRequestException(error);
    }
  }

  //? notice that records will be sorted by range key, which is id
  //? (in msg_xx_## format string; xx is milliseconds).
  //?
  async fetch(userId: number, lastKey: IAlarmKey | null): Promise<any> {
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

  async findById(key: IAlarmKey): Promise<IAlarm> {
    try {
      return this.model.get(key);
    } catch (error) {
      console.error(`[dynamodb] error`, error);
      throw new BadRequestException(error);
    }
  }

  async update(key: IAlarmKey, dto: UpdateAlarmDto): Promise<IAlarm> {
    try {
      return this.model.update(key, dto);
    } catch (error) {
      console.error(`[dynamodb] error`, error);
      throw new BadRequestException(error);
    }
  }

  async delete(key: IAlarmKey): Promise<any> {
    try {
      return this.model.delete(key);
    } catch (error) {
      console.error(`[dynamodb] error`, error);
      throw new BadRequestException(error);
    }
  }
}
