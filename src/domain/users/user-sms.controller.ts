import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Inject,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { SmsClient } from '@nestjs-packages/ncp-sens';
import { SmsMessageDto } from 'src/domain/users/dto/sms-message.dto';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UserSmsController {
  constructor(@Inject(SmsClient) private readonly smsClient: SmsClient) {}

  //?-------------------------------------------------------------------------//
  //? topic 으로 FCM 발송
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'topic 으로 FCM 발송' })
  @Post('sms')
  async sendSms(@Body() dto: SmsMessageDto): Promise<any> {
    await this.smsClient.send({
      to: dto.phone,
      content: dto.body,
    });
  }
}
