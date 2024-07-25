import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { SmsClient } from '@nestjs-packages/ncp-sens';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { Throttle } from '@nestjs/throttler';
import { AnyData } from 'src/common/types';
import { ThrottlerBehindProxyGuard } from 'src/common/guards/throttler-behind-proxy.guard';
import { UpdateUserDto } from 'src/domain/users/dto/update-user.dto';
import { SendSmsDto } from 'src/domain/users/dto/send-sms.dto';
import { User } from 'src/domain/users/entities/user.entity';
import { UserOtpsService } from 'src/domain/users/user-otps.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UserOtpsController {
  constructor(
    private readonly userOtpsService: UserOtpsService,
    @Inject(SmsClient) private readonly smsClient: SmsClient,
  ) {}

  //? ----------------------------------------------------------------------- //
  //? 본인인증 OTP 발송 (1분에 최대 2번)
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'non-existing key(phone/email) OTP 발급' })
  @UseGuards(ThrottlerBehindProxyGuard)
  @Throttle({ default: { limit: 2, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post(':key/otp')
  async validateEmailAndSendOtp(
    @Param('key') key: string,
    @Query('cache') cache: string | null | undefined,
  ): Promise<any> {
    await this.userOtpsService.sendOtpForNonExistingUser(key, !!cache);
    return { data: 'ok' };
  }

  //? 전화번호(이메일) 업데이트
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
    @Query('cache') cache: string | null | undefined,
  ): Promise<AnyData> {
    await this.userOtpsService.sendOtpForExistingUser(key, !!cache);
    return { data: 'ok' };
  }

  @ApiOperation({ description: 'OTP 코드 검사' })
  @HttpCode(HttpStatus.OK)
  @Patch(':key/otp/:otp')
  async checkOtp(
    @CurrentUserId() userId: number,
    @Param('key') key: string,
    @Param('otp') otp: string,
    @Query('cache') cache: string | null | undefined,
    @Body() dto: UpdateUserDto,
  ): Promise<User> {
    return await this.userOtpsService.checkOtp(userId, key, otp, !!cache, dto);
  }

  //! @deprecated 미사용
  @ApiOperation({ description: 'user 에게 SMS 문자 발송' })
  @Post('send-sms')
  async sendSms(@Body() dto: SendSmsDto): Promise<void> {
    await this.smsClient.send({
      to: dto.phone,
      content: dto.body,
    });
  }
}
