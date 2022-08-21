import { Logger } from '@nestjs/common';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import * as firebaseAdmin from 'firebase-admin';

//** heavily based on https://github.com/costianur95/nestjs-fcm */

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);

  async sendNotification(
    token: string,
    title: string,
    body: string,
    data: any,
    awake?: boolean,
  ) {
    const payload = {
      notification: {
        title: title,
        body: body,
      },
    };
    const option = {
      contentAvailable: awake ?? false,
    };
    this.logger.log(body);
    return await firebaseAdmin.messaging().sendToDevice(token, payload, option);
  }

  async sendNotifications(
    deviceIds: Array<string>,
    payload: firebaseAdmin.messaging.MessagingPayload,
    awake?: boolean,
    imageUrl?: string,
  ) {
    if (deviceIds.length == 0) {
      throw new Error('No device token is provided.');
    }

    const body: firebaseAdmin.messaging.MulticastMessage = {
      tokens: deviceIds,
      data: payload?.data,
      notification: {
        title: payload?.notification?.title,
        body: payload?.notification?.body,
        imageUrl,
      },
      apns: {
        payload: {
          aps: {
            sound: payload?.notification?.sound,
            contentAvailable: awake ?? false,
            mutableContent: true,
          },
        },
        fcmOptions: {
          imageUrl,
        },
      },
      android: {
        priority: 'high',
        ttl: 60 * 60 * 24,
        notification: {
          sound: payload?.notification?.sound,
        },
      },
    };

    let result = null;
    let failureCount = 0;
    let successCount = 0;
    const failedDeviceIds = [];

    while (deviceIds.length) {
      try {
        result = await firebaseAdmin
          .messaging()
          .sendMulticast({ ...body, tokens: deviceIds.splice(0, 500) }, false);
        if (result.failureCount > 0) {
          const failedTokens = [];
          result.responses.forEach((resp, id) => {
            if (!resp.success) {
              failedTokens.push(deviceIds[id]);
            }
          });
          failedDeviceIds.push(...failedTokens);
        }
        failureCount += result.failureCount;
        successCount += result.successCount;
      } catch (error) {
        this.logger.error(error.message, error.stackTrace, 'fcm-service');
        throw error;
      }
    }
    this.logger.log(
      `successCount: ${successCount}, failureCount: ${failureCount}, failedDeviceIds: ${failedDeviceIds.join(
        ',',
      )}`,
    );
    return { failureCount, successCount, failedDeviceIds };
  }
}
