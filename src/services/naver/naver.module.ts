import { SensModule } from '@nestjs-packages/ncp-sens';
import { Module } from '@nestjs/common';
import { NaverService } from 'src/services/naver/naver.service';

@Module({
  imports: [
    SensModule.forRoot({
      accessKey: process.env.NAVER_ACCESS_KEY,
      secretKey: process.env.NAVER_SECRET_KEY,
      sms: {
        smsServiceId: process.env.NAVER_SMS_SERVICE_ID,
        smsSecretKey: process.env.NAVER_SMS_SECRET_KEY,
        callingNumber: process.env.NAVER_SMS_PHONE_NUMBER,
      },
      alimtalk: {
        alimtalkServiceId: process.env.NAVER_ALIMTALK_SERVICE_ID,
        plusFriendId: process.env.NAVER_PLUS_FRIEND_ID,
      },
    }),
  ],
  exports: [NaverService],
  providers: [NaverService],
})
export class NaverModule {}
