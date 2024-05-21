import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserNotificationEvent } from 'src/domain/users/events/user-notification.event';
import { FcmService } from 'src/services/fcm/fcm.service';

@Injectable()
export class UserNotificationListener {
  private readonly logger = new Logger(UserNotificationListener.name);
  constructor(private readonly fcmService: FcmService) {}

  @OnEvent('user.notified', { async: true })
  async handleOrderCreatedEvent(event: UserNotificationEvent): Promise<void> {
    const fbToken = event.token;

    // todo. dynamodb 알림 record 생성
    const userSetting = event.options.hasOwnProperty(event.name)
      ? event.options[event.name]
      : false;
    const notification = {
      title: 'MeSo',
      body: event.body,
    };
    if (fbToken && userSetting) {
      try {
        await this.fcmService.sendToToken(fbToken, notification);
      } catch (e) {
        // todo. slack or sentry report
        this.logger.error(e);
      }
    }
  }
}
