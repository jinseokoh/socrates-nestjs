import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as moment from 'moment';
import {
  RABBITMQ_CLIENT,
  REDIS_PUBSUB_CLIENT,
} from 'src/common/constants/index';
import { AuctionStatus } from 'src/common/enums';
import { AuctionItem } from 'src/common/types/auction-item.type';
import { AuctionsService } from 'src/domain/auctions/auctions.service';
import { OrdersService } from 'src/domain/orders/orders.service';
@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private readonly auctionsService: AuctionsService,
    private readonly ordersService: OrdersService,
    @Inject(REDIS_PUBSUB_CLIENT) private readonly redisClient: ClientProxy,
    @Inject(RABBITMQ_CLIENT) private readonly rabbitClient: ClientProxy,
  ) {}

  //**--------------------------------------------------------------------------*/
  //** EVERY 5 MINTUES
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleTenSeconds() {
    await this.redisClient.emit('RealTime', {
      auctionId: 666,
    });

    this.logger.debug(`cron every 5 mins @${new Date().toLocaleString()}`);
  }

  //**--------------------------------------------------------------------------*/
  //** EVERY MINUTE
  @Cron(CronExpression.EVERY_MINUTE)
  async handleEveryMinute() {
    this.logger.debug('cron every minute');
    const now = moment().seconds(0).milliseconds(0); // to remove jitter
    const preparingItems = await this.auctionsService.getAuctionItemsOf(
      AuctionStatus.PREPARING,
    );
    const ongoingItems = await this.auctionsService.getAuctionItemsOf(
      AuctionStatus.ONGOING,
    );

    //** 경매시작시) 관심 고객들에게 경매시작 알림
    preparingItems
      .filter((item) => now >= moment(item.startTime))
      .map(async (item) => {
        await this.auctionsService.update(item.id, {
          status: AuctionStatus.ONGOING,
        });
        //** dispatch AuctionBegan
        this.rabbitClient.emit('AuctionBegan', {
          auctionId: item.id,
        } as AuctionItem);
        this.logger.log(`[AuctionBegan] w/ auctionId: ${item.id}`);
        return item.id;
      });

    //** 종료시) 오더생성 후, 위너에게 낙찰사실 알림
    ongoingItems
      .filter((item) => now >= moment(item.closingTime))
      .map(async (item) => {
        // all expired items will be set to ENDED
        await this.auctionsService.update(item.id, {
          status: AuctionStatus.ENDED,
        });

        try {
          // will throw an error when it doesn't meet certain conditions
          await this.ordersService.create(item.id);
        } catch (e: unknown) {
          let message = 'unknown';
          if (typeof e === 'string') {
            message = e;
          } else if (e instanceof Error) {
            message = e.message;
          }
          this.logger.log(`[AuctionEnded] w/ exception: ${message}`);
          return;
        }

        //** dispatch AuctionEnded
        this.rabbitClient.emit('AuctionEnded', {
          auctionId: item.id,
        } as AuctionItem);
        this.logger.log(`[AuctionEnded] w/ auctionId: ${item.id}`);
        return item.id;
      });

    //** 종료 1시간전) 관심 고객들에게 1시간전 경매종료임박 알림
    ongoingItems
      .filter((item) => {
        const end = moment(item.endTime);
        const duration = moment.duration(end.diff(now));
        const diff = duration.asMinutes();
        return diff === 60; // 정확히 60분 남은 경우
      })
      .map((item) => {
        //** dispatch AuctionEndsInAnHour
        this.rabbitClient.emit('AuctionEndsInAnHour', {
          auctionId: item.id,
        } as AuctionItem);
        this.logger.log(`[AuctionEndsInAnHour] w/ auctionId: ${item.id}`);
        return item.id;
      });
  }

  //**--------------------------------------------------------------------------*/
  //** EVERY DAY AT 1PM
  @Cron(CronExpression.EVERY_DAY_AT_1PM)
  async handleEveryDayAt1pm() {
    this.logger.debug('cron every day at 1pm');
    const items = await this.auctionsService.getUnpaidItems();

    //** 3일안에 낙찰받고 미결제한 사용자 아이디와 해당 경매작 아이디
    items.map((item) => {
      //** dispatch PaymentReminder
      this.rabbitClient.emit('PaymentReminder', {
        auctionId: item.id,
      } as AuctionItem);
      this.logger.log(`[PaymentReminder] w/ auctionId: ${item.id}`);
      return item.id;
    });
  }

  //**--------------------------------------------------------------------------*/
  //** EVERY DAY AT 2PM
  @Cron(CronExpression.EVERY_DAY_AT_2PM)
  async handleEveryDayAt2pm() {
    this.logger.debug('cron every day at 2pm');
    // const weeks = moment().format(`ggggww`);
    const items =
      await this.auctionsService.getPaidItemsOnThe8thDayAfterPayment();

    //** 일주일전에 낙찰받고 결제한 사용자 아이디와 해당 경매작 아이디
    items.map((item) => {
      //** dispatch OneWeekReminder
      this.rabbitClient.emit('OneWeekReminder', {
        auctionId: item.id,
      } as AuctionItem);
      this.logger.log(`[OneWeekReminder] w/ auctionId: ${item.id}`);
      return item.id;
    });
  }
}
