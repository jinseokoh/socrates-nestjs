import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { FriendRequestApprovalEvent } from 'src/domain/users/events/friend-request-approval.event';
import { FcmService } from 'src/services/fcm/fcm.service';

@Injectable()
export class UsersFriendshipListener {
  private readonly logger = new Logger(UsersFriendshipListener.name);
  constructor(private readonly fcmService: FcmService) {}

  @OnEvent('friendRequest.approval')
  handleOrderCreatedEvent(event: FriendRequestApprovalEvent) {
    const fbToken = event.token;
    const config = event.options.hasOwnProperty(event.name)
      ? event.options[event.name]
      : false;
    const notification = {
      title: 'MeSo',
      body: event.body,
    };
    if (fbToken && config) {
      try {
        this.fcmService.sendToToken(fbToken, notification);
      } catch (e) {
        this.logger.error(e);
      }
    }
  }
}
