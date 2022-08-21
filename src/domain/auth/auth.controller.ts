import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation } from '@nestjs/swagger';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { GetCurrentRefreshToken } from 'src/common/decorators/get-current-refresh-token.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { FirebaseUser } from 'src/common/types/firebase-user.type';
import { AuthService } from 'src/domain/auth/auth.service';
import { ForgotPasswordDto } from 'src/domain/auth/dto/forgot-password.dto';
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

  @ApiOperation({ description: '사용자 등록 (w/ Credentials)' })
  @Public()
  @Post('register')
  async register(
    @Body(UniqueKeysPipe, HashPasswordPipe) dto: UserCredentialsDto,
  ): Promise<any> {
    await this.authService.register(dto);
    // const result = await this.authService.register(dto);
    // await this.authService.sendEmail('chuckau@naver.com', '123456');
    // return result;
  }

  // @ApiOperation({ description: '사용자 등록 (via 소셜인증)' })
  // @Public()
  // @Post('social')
  // async social(@Body() dto: UserSocialIdDto): Promise<Tokens> {
  //   return await this.authService.socialize(dto);
  // }

  @ApiOperation({ description: 'firebase auth 소셜인증' })
  @Public()
  @UseGuards(AuthGuard('firebase'))
  @Get('firebase')
  async firebaseAuth(@Req() req) {
    const firebaseUser = req as FirebaseUser;
    if (!firebaseUser.email) {
      throw new BadRequestException(`email is mandatory.`);
    }
    const dto = {
      email: firebaseUser.email,
      providerName: 'firebase',
      providerId: firebaseUser.uid,
      phone: firebaseUser.phone_number,
      photo: firebaseUser.picture,
    } as UserSocialIdDto;
    return await this.authService.socialize(dto);
  }

  @ApiOperation({ description: '사용자 로그인 (w/ Credentials)' })
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: UserCredentialsDto): Promise<Tokens> {
    return await this.authService.login(dto);
  }

  @ApiOperation({ description: '비밀번호를 잊었나요?' })
  @Public()
  @Post('forgot')
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<any> {
    return await this.authService.forgotPassword(dto.email);
  }

  @ApiOperation({ description: '비밀번호를 재설정' })
  @Public()
  @Post('reset')
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<any> {
    return await this.authService.resetPassword(dto);
  }

  @ApiOperation({ description: '사용자 로그아웃' })
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@CurrentUserId() id: number): any {
    return this.authService.logout(id);
  }

  @ApiOperation({ description: '사용자 Refresh 토큰 갱신' })
  @Public()
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(
    @CurrentUserId() id: number,
    @GetCurrentRefreshToken() token: string,
  ): any {
    return this.authService.refreshToken(id, token);
  }
}
