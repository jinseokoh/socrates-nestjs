import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as moment from 'moment';
import {
  RABBITMQ_CLIENT,
  REDIS_PUBSUB_CLIENT,
} from 'src/common/constants/index';
@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    @Inject(REDIS_PUBSUB_CLIENT) private readonly redisClient: ClientProxy,
    @Inject(RABBITMQ_CLIENT) private readonly rabbitClient: ClientProxy,
  ) {}

  //? ----------------------------------------------------------------------- //
  //? EVERY 5 MINTUES
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleTenSeconds() {
    await this.redisClient.emit('RealTime', {
      auctionId: 666,
    });

    this.logger.debug(`cron every 5 mins @${new Date().toLocaleString()}`);
  }

  //? ----------------------------------------------------------------------- //
  //? EVERY MINUTE
  @Cron(CronExpression.EVERY_MINUTE)
  async handleEveryMinute() {
    this.logger.debug('cron every minute');
    const now = moment().seconds(0).milliseconds(0); // to remove jitter
  }
}
