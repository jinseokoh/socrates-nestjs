import { BadRequestException, Logger } from '@nestjs/common';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import * as firebaseAdmin from 'firebase-admin';
import { MulticastMessage } from 'firebase-admin/lib/messaging/messaging-api';

//** reference) https://blog.logrocket.com/implement-in-app-notifications-nestjs-mysql-firebase/

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);

  async sendToToken(
    token: string,
    notification: firebaseAdmin.messaging.Notification,
  ) {
    let result = null;
    const payload: firebaseAdmin.messaging.Message = {
      token,
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.imageUrl,
      },
      apns: {
        fcmOptions: {
          imageUrl: notification?.imageUrl,
        },
      },
      android: {
        priority: 'high',
        ttl: 60 * 60 * 24,
      },
    };
    try {
      result = await firebaseAdmin.messaging().send(payload);
    } catch (error) {
      this.logger.error(error.message, error.stackTrace, 'sendToToken');
      throw error;
    }
    return result;
  }

  async sendToTopic(
    topic: string,
    notification: firebaseAdmin.messaging.Notification,
  ) {
    const payload: firebaseAdmin.messaging.Message = {
      topic,
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.imageUrl,
      },
      apns: {
        fcmOptions: {
          imageUrl: notification?.imageUrl,
        },
      },
      android: {
        priority: 'high',
        ttl: 60 * 60 * 24,
      },
    };
    let result = null;
    try {
      result = await firebaseAdmin.messaging().send(payload);
    } catch (error) {
      this.logger.error(error.message, error.stackTrace, 'sendToTopic');
      throw error;
    }
    return result;
  }

  async sendToCondition(
    condition: string,
    notification: firebaseAdmin.messaging.Notification,
  ) {
    const payload: firebaseAdmin.messaging.Message = {
      condition,
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.imageUrl,
      },
      apns: {
        fcmOptions: {
          imageUrl: notification?.imageUrl,
        },
      },
      android: {
        priority: 'high',
        ttl: 60 * 60 * 24,
      },
    };
    let result = null;
    try {
      result = await firebaseAdmin.messaging().send(payload);
    } catch (error) {
      this.logger.error(error.message, error.stackTrace, 'sendToCondition');
      throw error;
    }
    return result;
  }

  async sendMulticast(
    tokens: string[],
    notification: firebaseAdmin.messaging.Notification,
  ) {
    if (tokens.length < 1) {
      throw new BadRequestException('No token is provided.');
    }

    const payload: firebaseAdmin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title: notification?.title,
        body: notification?.body,
        imageUrl: notification?.imageUrl,
      },
      apns: {
        fcmOptions: {
          imageUrl: notification?.imageUrl,
        },
      },
      android: {
        priority: 'high',
        ttl: 60 * 60 * 24,
      },
    };

    let result = null;
    let failureCount = 0;
    let successCount = 0;
    const sendingTokens = [...tokens];

    while (sendingTokens.length > 0) {
      try {
        result = await firebaseAdmin.messaging().sendEachForMulticast({
          ...payload,
          tokens: sendingTokens.splice(0, 500),
        });
        failureCount += result.failureCount;
        successCount += result.successCount;
      } catch (error) {
        this.logger.error(error.message, error.stackTrace, 'sendMulticast');
        throw error;
      }
    }
    this.logger.log(`success: ${successCount}, failure: ${failureCount}`);
    return { failureCount, successCount };
  }
}
