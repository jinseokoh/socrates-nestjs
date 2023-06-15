import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation } from '@nestjs/swagger';
import { SmsClient } from '@nestjs-packages/ncp-sens';
import { SmsMessageDto } from 'src/domain/users/dto/sms-message.dto';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { UsersService } from 'src/domain/users/users.service';
import { AnyData } from 'src/common/types';
import { ThrottlerBehindProxyGuard } from 'src/common/guards/throttler-behind-proxy.guard';
import { Throttle } from '@nestjs/throttler';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UserSmsController {
  constructor(
    private readonly usersService: UsersService,
    @Inject(SmsClient) private readonly smsClient: SmsClient,
  ) {}

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

  // 본인인증 OTP SMS 발송
  // rate limiting 적용
  @ApiOperation({ description: 'non-existing key(phone/email) OTP 발급' })
  @UseGuards(ThrottlerBehindProxyGuard)
  @Throttle(1, 60)
  @HttpCode(HttpStatus.OK)
  @Post(':key/otp')
  async validateEmailAndSendOtp(
    @Param('key') key: string,
    // @Query('force') force: string | undefined,
    // @Query('cache') cache: string | undefined,
  ): Promise<any> {
    await this.usersService.sendOtpForNonExistingUser(key);
    return { data: 'ok' };
  }

  // 전화번호(이메일) 업데이트
  // prerequisite)
  // - 기존정보 확인 (전화번호나 이메일)
  // - any user associated w/ old phone or email must exist.
  // - 비번 확인
  // 1) any user associated w/ new phone or email must not exist.
  // 2) 바꿀 새로운 phone or email 로 비번 전송
  @ApiOperation({ description: 'existing key(phone/email) OTP 발급' })
  @HttpCode(HttpStatus.OK)
  @Post(':key/change')
  async sendOtpForExistingUser(
    @Param('key') key: string,
    @Query('cache') cache: string | null,
  ): Promise<AnyData> {
    await this.usersService.sendOtpForExistingUser(key, !!cache);
    return { data: 'ok' };
  }

  @ApiOperation({ description: 'OTP 코드 검사' })
  @HttpCode(HttpStatus.OK)
  @Get(':key/otp/:otp')
  async checkOtp(
    @CurrentUserId() id: number,
    @Param('key') key: string,
    @Param('otp') otp: string,
    @Query('cache') cache: string | null,
    // @Body() dto: UpdateUserDto,
  ): Promise<AnyData> {
    await this.usersService.checkOtp(key, otp, !!cache);
    return { data: 'ok' };
  }
}
