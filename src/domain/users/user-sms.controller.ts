import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation } from '@nestjs/swagger';
import { SmsClient } from '@nestjs-packages/ncp-sens';
import { SmsMessageDto } from 'src/domain/users/dto/sms-message.dto';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { UpdateUserDto } from 'src/domain/users/dto/update-user.dto';
import { User } from 'src/domain/users/entities/user.entity';
import { UsersService } from 'src/domain/users/users.service';

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

  // 본인인증시 OTP 발송
  // 1) if any user w/ phone or email already exists
  //   throw an exception
  // 2) if any user w/ phone or email doesn't exist
  //   - if secret (otp) doesn't exist, issue one
  //   - if secret (otp) exists
  //     - if the otp issued within 2 mins, throw an exception
  //     - reissue one
  @ApiOperation({ description: 'non-existing key(phone/email) OTP 발급' })
  @HttpCode(HttpStatus.OK)
  @ApiCreatedResponse({ description: 'otp 발송' })
  @Post(':key/otp')
  async validateEmailAndSendOtp(
    @Param('key') key: string,
    @Query('cache') cache: string | null,
  ): Promise<any> {
    await this.usersService.sendOtpForNonExistingUser(key, !!cache);
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
  ): Promise<any> {
    await this.usersService.sendOtpForExistingUser(key, !!cache);
    return { data: 'ok' };
  }

  @ApiOperation({ description: 'OTP 코드 확인 후 사용자 본인인증 정보 갱신' })
  @HttpCode(HttpStatus.OK)
  @Post(':key/otp/:otp')
  async checkOtp(
    @CurrentUserId() id: number,
    @Param('key') key: string,
    @Param('otp') otp: string,
    @Query('cache') cache: string | null,
    @Body() dto: UpdateUserDto,
  ): Promise<User> {
    console.log(!!cache);
    await this.usersService.checkOtp(key, otp, !!cache);
    return this.usersService.update(id, dto);
  }
}
