import { SensModule } from '@nestjs-packages/ncp-sens';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NaverService } from 'src/services/naver/naver.service';

@Module({
  imports: [
    SensModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        accessKey: configService.get('naver.accessKey'),
        secretKey: configService.get('naver.secretKey'),
        sms: {
          smsServiceId: configService.get('naver.smsServiceId'),
          smsSecretKey: configService.get('naver.smsSecretKey'),
          callingNumber: configService.get('naver.smsPhoneNumber'),
        },
        alimtalk: {
          alimtalkServiceId: configService.get('naver.alimtalkServiceId'),
          plusFriendId: configService.get('naver.plusFriendId'),
        },
      }),
    }),
  ],
  exports: [NaverService],
  providers: [NaverService],
})
export class NaverModule {}
