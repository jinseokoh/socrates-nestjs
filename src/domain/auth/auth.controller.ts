import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Res,
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
import { Tokens } from 'src/common/types';
import { HashPasswordPipe } from 'src/domain/users/pipes/hash-password.pipe';
import { UniqueKeysPipe } from 'src/domain/users/pipes/unique-keys.pipe';
import { Response as ExpressResponse } from 'express';
@UseInterceptors(ClassSerializerInterceptor)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  //? ----------------------------------------------------------------------- //
  //? Public) 가입, 이메일인증, 비번재설정
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '이메일 가입 w/ Credentials' })
  @Public()
  @ApiCreatedResponse({ description: 'register' })
  @Post('register')
  async register(
    @Body(UniqueKeysPipe, HashPasswordPipe) dto: UserCredentialsDto,
  ): Promise<Tokens> {
    return await this.authService.register(dto);
  }

  @ApiOperation({ description: '비밀번호 재설정' })
  @HttpCode(HttpStatus.OK)
  @Public()
  @Patch('reset')
  async resetPassword(
    @Body(HashPasswordPipe) dto: ResetPasswordDto,
  ): Promise<any> {
    await this.authService.resetPassword(dto);
    return { data: 'ok' };
  }

  //? ----------------------------------------------------------------------- //
  //? Public) 소셜 로그인
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'Firebase Auth 소셜인증' })
  @Public()
  // @UseGuards(AuthGuard('firebase'))
  @ApiCreatedResponse({
    description: 'firebase 애플/구글/카카오 로그인 후 FleaAuction 로그인',
  })
  @Post('firebase')
  async firebaseAuth(
    @Body() dto: FirebaseUserDto,
    @Res({ passthrough: true }) response: ExpressResponse,
  ): Promise<Tokens> {
    const userSocialIdDto = {
      providerName: 'firebase',
      email: dto.email,
      providerId: dto.uid,
      phone: dto.phoneNumber,
      photo: dto.photoURL,
    } as UserSocialIdDto;
    const authTokens = await this.authService.socialize(userSocialIdDto);
    this.authService.storeTokensInCookie(response, authTokens);

    return authTokens;
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

  //? ----------------------------------------------------------------------- //
  //? Public) 로그인
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '로그인 w/ Credentials' })
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiCreatedResponse({ description: 'login 성공' })
  @Post('login')
  async login(
    @Body() dto: UserCredentialsDto,
    @Res({ passthrough: true }) response: ExpressResponse,
  ): Promise<Tokens> {
    const authTokens = await this.authService.login(dto);
    this.authService.storeTokensInCookie(response, authTokens);

    return authTokens;
  }

  //? ----------------------------------------------------------------------- //
  //? Public) 토큰 refresh
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '사용자 Refresh 토큰 갱신' })
  @Public()
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @ApiCreatedResponse({ description: 'refresh 성공' })
  @Post('refresh')
  async refresh(
    @CurrentUserId() id: number,
    @GetCurrentRefreshToken() token: string,
    @Res({ passthrough: true }) response: ExpressResponse,
  ): Promise<Tokens> {
    const authTokens = await this.authService.refreshToken(id, token);
    this.authService.storeTokensInCookie(response, authTokens);

    return authTokens;
  }

  //? ----------------------------------------------------------------------- //
  //? 로그아웃
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: '사용자 로그아웃' })
  @HttpCode(HttpStatus.OK)
  @ApiCreatedResponse({ description: '성공' })
  @Post('logout')
  logout(@CurrentUserId() id: number): Promise<void> {
    return this.authService.logout(id);
  }
}
