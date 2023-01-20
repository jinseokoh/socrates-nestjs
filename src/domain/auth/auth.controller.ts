import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation } from '@nestjs/swagger';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { GetCurrentRefreshToken } from 'src/common/decorators/get-current-refresh-token.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { AuthService } from 'src/domain/auth/auth.service';
import { FirebaseUserDto } from 'src/domain/auth/dto/firebase-user.dto';
import { ResetPasswordDto } from 'src/domain/auth/dto/reset-password.dto';
import { UserCredentialsDto } from 'src/domain/auth/dto/user-credentials.dto';
import { UserSocialIdDto } from 'src/domain/auth/dto/user-social-id.dto';
import { JwtRefreshGuard } from 'src/domain/auth/guards/jwt-refresh.guard';
import { Tokens } from 'src/domain/auth/types/tokens.type';
import { HashPasswordPipe } from 'src/domain/users/pipes/hash-password.pipe';
import { UniqueKeysPipe } from 'src/domain/users/pipes/unique-keys.pipe';
@UseInterceptors(ClassSerializerInterceptor)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  //?-------------------------------------------------------------------------//
  //? Public) 가입, 이메일인증, 비번재설정
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '이메일 가입 w/ Credentials' })
  @Public()
  @ApiCreatedResponse({ description: 'register 성공' })
  @Post('register')
  async register(
    @Body(UniqueKeysPipe, HashPasswordPipe) dto: UserCredentialsDto,
  ): Promise<any> {
    return await this.authService.register(dto);
  }

  // any existing emails will NOT be accepted.
  @ApiOperation({ description: '새이메일 확인 후 OTP 전송' })
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiCreatedResponse({ description: 'validate 성공' })
  @Post('validate')
  async validateEmailAndSendOtp(@Body('email') email): Promise<any> {
    await this.authService.takeNewEmailAndSendOtp(email);
    return { data: 'ok' };
  }

  // any new emails will NOT be accepted.
  @ApiOperation({ description: '기이메일 확인 후 OTP 전송' })
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiCreatedResponse({ description: 'forgot 성공' })
  @Post('forgot')
  async forgotEmailAndSendOtp(@Body('email') email): Promise<any> {
    await this.authService.takeExistingEmailAndSendOtp(email);
    return { data: 'ok' };
  }

  @ApiOperation({ description: '이메일 OTP 확인' })
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiCreatedResponse({ description: 'otp 성공' })
  @Get('otp')
  async validateOtp(
    @Query('email') email: string,
    @Query('code') code: string,
  ): Promise<any> {
    await this.authService.validateOtp(email, code);
    return { data: 'ok' };
  }

  @ApiOperation({ description: '비밀번호 재설정' })
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiCreatedResponse({ description: 'reset 성공' })
  @Patch('reset')
  async resetPassword(
    @Body(HashPasswordPipe) dto: ResetPasswordDto,
  ): Promise<any> {
    await this.authService.resetPassword(dto);
    return { data: 'ok' };
  }

  //?-------------------------------------------------------------------------//
  //? Public) 소셜 로그인
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Firebase Auth 소셜인증' })
  @Public()
  // @UseGuards(AuthGuard('firebase'))
  @ApiCreatedResponse({
    description: 'firebase 애플/구글/카카오 로그인 후 FleaAuction 로그인',
  })
  @Post('firebase')
  async firebaseAuth(@Body() dto: FirebaseUserDto): Promise<any> {
    const userSocialIdDto = {
      providerName: 'firebase',
      email: dto.email,
      providerId: dto.uid,
      phone: dto.phoneNumber,
      photo: dto.photoURL,
    } as UserSocialIdDto;
    return await this.authService.socialize(userSocialIdDto);
  }

  // @ApiOperation({ description: 'Firebase Auth 소셜인증' })
  // @Public()
  // @UseGuards(AuthGuard('firebase'))
  // @ApiCreatedResponse({ description: 'firebase 성공' })
  // @Post('firebase')
  // async firebaseAuth(@Req() req): Promise<any> {
  //   const firebaseUser = req as FirebaseUser;
  //   if (!firebaseUser.email) {
  //     throw new BadRequestException(`param email is missing`);
  //   }
  //   const userSocialIdDto = {
  //     providerName: 'firebase',
  //     email: firebaseUser.email,
  //     providerId: firebaseUser.uid,
  //     phone: firebaseUser.phoneNumber, // used to be phone_number
  //     photo: firebaseUser.photoURL, // used to be picture
  //   } as UserSocialIdDto;
  //   return await this.authService.socialize(userSocialIdDto);
  // }

  //?-------------------------------------------------------------------------//
  //? Public) 로그인
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '로그인 w/ Credentials' })
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiCreatedResponse({ description: 'login 성공' })
  @Post('login')
  async login(@Body() dto: UserCredentialsDto): Promise<Tokens> {
    return await this.authService.login(dto);
  }

  //?-------------------------------------------------------------------------//
  //? Public) 토큰 refresh
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '✅ 사용자 Refresh 토큰 갱신' })
  @Public()
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @ApiCreatedResponse({ description: 'refresh 성공' })
  @Post('refresh')
  refresh(
    @CurrentUserId() id: string,
    @GetCurrentRefreshToken() token: string,
  ): any {
    return this.authService.refreshToken(id, token);
  }

  //?-------------------------------------------------------------------------//
  //? Private) 로그아웃
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '사용자 로그아웃' })
  @HttpCode(HttpStatus.OK)
  @ApiCreatedResponse({ description: '성공' })
  @Post('logout')
  logout(@CurrentUserId() id: string): any {
    return this.authService.logout(id);
  }

  // @ApiOperation({ description: '비밀번호 변경' })
  // @HttpCode(HttpStatus.OK)
  // @Public()
  // @Post('forgot-password')
  // async changePassword(@Body() dto: ForgotPasswordDto): Promise<any> {
  //   await this.authService.forgotPassword(dto.email);
  //   return { data: 'ok' };
  // }

  // @ApiOperation({ description: '사용자 등록 (via 소셜인증)' })
  // @Public()
  // @Post('social')
  // async social(@Body() dto: UserSocialIdDto): Promise<Tokens> {
  //   return await this.authService.socialize(dto);
  // }
}
