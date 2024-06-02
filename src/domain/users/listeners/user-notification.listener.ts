import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AlarmType } from 'src/common/enums';
import { AlarmsService } from 'src/domain/alarms/alarms.service';
import { CreateAlarmDto } from 'src/domain/alarms/dto/create-alarm.dto';
import { UserNotificationEvent } from 'src/domain/users/events/user-notification.event';
import { FcmService } from 'src/services/fcm/fcm.service';

@Injectable()
export class UserNotificationListener {
  private readonly logger = new Logger(UserNotificationListener.name);
  constructor(
    private readonly fcmService: FcmService,
    private readonly alarmsService: AlarmsService,
  ) {}

  @OnEvent('user.notified', { async: true })
  async handleOrderCreatedEvent(event: UserNotificationEvent): Promise<void> {
    const fbToken = event.token;

    const userSetting = event.options.hasOwnProperty(event.name)
      ? event.options[event.name]
      : false;
    const notification = {
      title: 'MeSo',
      body: event.body,
    };
    const data = event.data;
    if (fbToken && userSetting) {
      try {
        await this.fcmService.sendToToken(fbToken, notification, data);
      } catch (e) {
        // todo. slack or sentry report
        this.logger.error(e);
      }
    }

    // todo. 나머지 dynamodb 알림 record 생성
    if (event.name == 'friendRequest') {
      const alarmDto = new CreateAlarmDto();
      alarmDto.alarmType = AlarmType.ACTIVITY;
      alarmDto.userId = event.userId;
      alarmDto.message = event.body;
      alarmDto.data = event.data;
      await this.alarmsService.create(alarmDto);
    }
  }
}
