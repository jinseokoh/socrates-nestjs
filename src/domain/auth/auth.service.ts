import {
  BadRequestException,
  CACHE_MANAGER,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SES } from 'aws-sdk';
import * as bcrypt from 'bcrypt';
import * as random from 'randomstring';

import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { AWS_SES_CONNECTION } from 'src/common/constants';
import { GenderEnum } from 'src/common/enums/gender';
import { ResetPasswordDto } from 'src/domain/auth/dto/reset-password.dto';
import { UserCredentialsDto } from 'src/domain/auth/dto/user-credentials.dto';
import { UserSocialIdDto } from 'src/domain/auth/dto/user-social-id.dto';
import { Tokens } from 'src/domain/auth/types/tokens.type';
import { CreateUserDto } from 'src/domain/users/dto/create-user.dto';
import { User } from 'src/domain/users/entities/user.entity';
import { ProvidersService } from 'src/domain/users/providers.service';
import { UsersService } from 'src/domain/users/users.service';
import { getUsername } from 'src/helpers/random-username';

@Injectable()
export class AuthService {
  private readonly env: any;
  constructor(
    private readonly usersService: UsersService,
    private readonly providersService: ProvidersService,
    private readonly jwtService: JwtService,
    @Inject(AWS_SES_CONNECTION)
    private readonly ses: SES,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(ConfigService) private configService: ConfigService,
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //?-------------------------------------------------------------------------//
  //? Passport local stragegy
  //?-------------------------------------------------------------------------//

  // being used in auth/strategies/local.strategy
  async validateUser(dto: UserCredentialsDto): Promise<User> {
    const user = await this.usersService.findByUniqueKey({
      where: { email: dto.email },
    });
    if (!user) {
      throw new ForbiddenException('access denied');
    }
    if (!user.password) {
      throw new ForbiddenException(`user has no password`);
    }
    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new ForbiddenException('invalid credentials');
    }

    return user;
  }

  //?-------------------------------------------------------------------------//
  //? Public) 가입, 이메일인증, 비번재설정
  //?-------------------------------------------------------------------------//

  // 이메일 가입 w/ Credentials
  async register(dto: UserCredentialsDto) {
    const user = await this.usersService.create(<CreateUserDto>dto);
    const tokens = await this._getTokens(user);
    const username = getUsername(user.id);

    await this._updateUserName(user.id, username);
    await this._updateUserRefreshTokenHash(user.id, tokens.refreshToken);

    return tokens;
  }

  // 새이메일 확인 후 OTP 전송
  async takeNewEmailAndSendOtp(email: string): Promise<void> {
    const user = await this.usersService.findByUniqueKey({ where: { email } });
    if (user) {
      throw new BadRequestException('email already taken');
    }
    const key = `${this.env}:user:${email}:email`;
    const secret = await this._setOtpWithKey(key);
    this._sendCodeEmail(email, secret);
  }

  // 기이메일 확인 후 OTP 전송
  async takeExistingEmailAndSendOtp(email: string): Promise<void> {
    const user = await this.usersService.findByUniqueKey({ where: { email } });
    if (!user) {
      throw new NotFoundException('email not found');
    }
    const key = `${this.env}:user:${email}:email`;
    const secret = await this._setOtpWithKey(key);
    this._sendCodeEmail(email, secret);
  }

  // 이메일 OTP 확인
  async validateOtp(email: string, code: string): Promise<void> {
    const key = `${this.env}:user:${email}:email`;
    const value = await this.cacheManager.get(key);
    if (!value) {
      throw new BadRequestException('otp expired');
    } else if (value !== code) {
      throw new BadRequestException('otp mismatched');
    }
  }

  // OTP 확인하여 이메일 확인
  async verify(id: number, code: string) {
    const key = `${this.env}:user:${id}:email`;
    const value = await this.cacheManager.get(key);
    if (!value) {
      throw new BadRequestException('otp expired');
    }
    if (code !== value) {
      throw new BadRequestException('otp mismatched');
    }
    await this._updateIsActive(id, true);
  }

  //?-------------------------------------------------------------------------//
  //? Public) 소셜 로그인
  //?-------------------------------------------------------------------------//

  // Firebase Auth 소셜인증
  async socialize(dto: UserSocialIdDto) {
    const { email, providerName, providerId, name, phone, photo, gender, dob } =
      dto;

    const provider = await this.providersService.findByUniqueKey({
      where: {
        providerName,
        providerId,
      },
      relations: ['user'],
    });

    // in case user w/ firebase-id found
    if (provider != null) {
      const tokens = await this._getTokens(provider.user);
      await this._updateUserRefreshTokenHash(
        provider.user.id,
        tokens.refreshToken,
      );
      return tokens;
    }

    const registeredUser = await this.usersService.findByUniqueKey({
      where: {
        email,
      },
    });
    // in case user w/ firebase-email found
    if (registeredUser != null) {
      await this.providersService.create({ ...dto, userId: registeredUser.id });
      const tokens = await this._getTokens(registeredUser);
      await this._updateUserRefreshTokenHash(
        registeredUser.id,
        tokens.refreshToken,
      );
      await this._updateIsActive(registeredUser.id, true);
      return tokens;
    }
    // in case user w/ firebase-email not found
    const genderEnum: GenderEnum | null = dto.gender
      ? dto.gender.toLowerCase().startsWith('f')
        ? GenderEnum.F
        : GenderEnum.M
      : null;

    const user = await this.usersService.create({
      ...dto,
      gender: genderEnum,
      isActive: true,
    });
    await this.providersService.create({ ...dto, userId: user.id });
    const tokens = await this._getTokens(user);
    const username = getUsername(user.id);

    await this._updateUserName(user.id, username);
    await this._updateUserRefreshTokenHash(user.id, tokens.refreshToken);
    return tokens;
  }

  //?-------------------------------------------------------------------------//
  //? Public) 로그인
  //?-------------------------------------------------------------------------//

  // 로그인 w/ Credentials
  async login(dto: UserCredentialsDto): Promise<Tokens> {
    const user = await this.validateUser(dto);
    const tokens = await this._getTokens(user);
    await this._updateUserRefreshTokenHash(user.id, tokens.refreshToken);

    return tokens;
  }

  //?-------------------------------------------------------------------------//
  //? Private) 로그아웃
  //?-------------------------------------------------------------------------//

  async logout(id: number) {
    return this._updateUserRefreshTokenHash(id, null);
  }

  //?-------------------------------------------------------------------------//
  //? Public) 토큰 refresh
  //?-------------------------------------------------------------------------//

  async refreshToken(id: number, token: string | null) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new ForbiddenException('access denied');
    }
    if (!user.refreshTokenHash) {
      throw new ForbiddenException('authentication required');
    }
    const refreshTokenMatches = await bcrypt.compare(
      token,
      user.refreshTokenHash,
    );
    if (!refreshTokenMatches) {
      throw new ForbiddenException('invalid refresh token');
    }
    const tokens = await this._getTokens(user);
    await this._updateUserRefreshTokenHash(user.id, tokens.refreshToken);

    return tokens;
  }

  // ✅ 이메일 확인코드 확인 후 비밀번호 갱신
  async resetPassword(dto: ResetPasswordDto): Promise<User> {
    const user = await this.usersService.findByUniqueKey({
      where: { email: dto.email },
    });
    if (!user) {
      throw new NotFoundException('email not found');
    }

    // const key = `${this.env}:user:${user.id}:otp`;
    // const value = await this.cacheManager.get(key);
    // if (!value) {
    //   throw new BadRequestException('otp expired');
    // } else if (value !== dto.code) {
    //   throw new BadRequestException('otp mismatched');
    // }

    return await this.usersService.update(user.id, { password: dto.password });
  }

  //?-------------------------------------------------------------------------//
  //? Privates
  //?-------------------------------------------------------------------------//

  async _updateIsActive(id: number, isActive: boolean) {
    await this.usersService.update(id, { isActive });
  }

  async _updateUserName(id: number, username: string | null) {
    await this.usersService.update(id, { username });
  }

  async _updateUserRefreshTokenHash(id: number, token: string | null) {
    const refreshTokenHash = token ? await bcrypt.hash(token, 10) : null;
    await this.usersService.update(id, { refreshTokenHash });
  }

  async _getTokens(user: User): Promise<Tokens> {
    const payload = {
      name: user.email,
      sub: user.id,
    };
    const accessTokenOptions = {
      secret: process.env.AUTH_TOKEN_SECRET ?? 'AUTH-TOKEN-SECRET',
      expiresIn: '1d', // todo. change it to '15m' in production
    };
    const refreshTokenOptions = {
      secret: process.env.REFRESH_TOKEN_SECRET ?? 'REFRESH-TOKEN-SECRET',
      expiresIn: '7d',
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, accessTokenOptions),
      this.jwtService.signAsync(payload, refreshTokenOptions),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async _setOtpWithKey(key: string) {
    const randomValue = random.generate({
      length: 5,
      charset: 'numeric',
    });

    await this.cacheManager.set(key, randomValue, 60 * 10);
    return randomValue;
  }

  // 이메일 발송 w/ 확인코드
  async _sendCodeEmail(email: string, code: string): Promise<any> {
    const params = {
      Destination: {
        CcAddresses: [],
        ToAddresses: [email],
      },
      Source: 'Flea Auction <no-reply@fleaauction.world>',
      Template: 'EmailCodeTemplate',
      TemplateData: `{ "code": "${code}" }`,
    };
    try {
      return await this.ses.sendTemplatedEmail(params).promise();
    } catch (e) {
      console.log(e);
      throw new BadRequestException('aws-ses error');
    }
  }

  // 이메일 발송 w/ no template
  async _sendEmail(email: string, message: string): Promise<any> {
    const params = {
      Destination: {
        CcAddresses: [],
        ToAddresses: [email],
      },
      Message: {
        /* required */
        Body: {
          /* required */
          Html: {
            Charset: 'UTF-8',
            Data: `<h1>${message}</h1>`,
          },
          Text: {
            Charset: 'UTF-8',
            Data: `${message}\n`,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: 'Test email',
        },
      },
      Source: 'Flea Auction <no-reply@fleaauction.world>',
      // ReplyToAddresses: ['chuck@fleaauction.co'],
    };

    return await this.ses.sendEmail(params).promise();
  }

  //--------------------------------------------------------------------------//
  // @deprecated
  //--------------------------------------------------------------------------//

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByUniqueKey({ where: { email } });
    if (!user) {
      throw new NotFoundException('email not found');
    }
    const key = `${this.env}:user:${user.id}:otp`;
    const value = await this.cacheManager.get(key);
    if (value) {
      throw new BadRequestException('too many attempts');
    }

    const secret = await this._setOtpWithKey(key);
    this._sendCodeEmail(email, secret);
  }
}
