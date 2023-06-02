import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SES } from 'aws-sdk';
import * as bcrypt from 'bcrypt';
import * as moment from 'moment';
import * as random from 'randomstring';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AWS_SES_CONNECTION } from 'src/common/constants';
import { Gender } from 'src/common/enums/gender';
import { ResetPasswordDto } from 'src/domain/auth/dto/reset-password.dto';
import { UserCredentialsDto } from 'src/domain/auth/dto/user-credentials.dto';
import { UserSocialIdDto } from 'src/domain/auth/dto/user-social-id.dto';
import { Tokens } from 'src/domain/auth/types/tokens.type';
import { CreateUserDto } from 'src/domain/users/dto/create-user.dto';
import { User } from 'src/domain/users/entities/user.entity';
import { ProvidersService } from 'src/domain/users/providers.service';
import { UsersService } from 'src/domain/users/users.service';
import { getUsername } from 'src/helpers/random-username';
import { SecretsService } from 'src/domain/secrets/secrets.service';
import { CreateSecretDto } from 'src/domain/secrets/dto/create-secret.dto';
import { UpdateSecretDto } from 'src/domain/secrets/dto/update-secret.dto';
import { Secret } from 'src/domain/secrets/secret.entity';
import { SmsClient } from '@nestjs-packages/ncp-sens';

@Injectable()
export class AuthService {
  private readonly env: any;
  constructor(
    private readonly usersService: UsersService,
    private readonly providersService: ProvidersService,
    private readonly secretsService: SecretsService,
    private readonly jwtService: JwtService,
    @Inject(SmsClient) private readonly smsClient: SmsClient,
    @Inject(AWS_SES_CONNECTION) private readonly ses: SES,
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
  //? Public) 전화번호
  //?-------------------------------------------------------------------------//

  // 새 전화번호 확인 후 OTP 전송
  async verifyPhoneNumberWithOtp(phone: string): Promise<string> {
    const user = await this.usersService.findByUniqueKey({
      where: { phone },
    });
    if (user) {
      throw new BadRequestException('phone already taken');
    }

    return await this._generateOtp(phone);
  }

  //?-------------------------------------------------------------------------//
  //? Public) 이메일 (가입/비번)
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

  // 새로운 전화번호/이메일 확인 후 OTP 전송
  async sendOtpForNonExistingUser(key: string, cache = false): Promise<void> {
    const user = await this.usersService.findByUniqueKey({ where: { key } });
    if (user) {
      throw new BadRequestException('Record with the key already exists');
    }
    const otp = cache
      ? await this._generateOtpWithCache(key)
      : await this._generateOtp(key);

    if (key === 'phone') {
      await this._sendSmsTo(key, otp);
    } else {
      await this._sendEmailTemplateTo(key, otp);
    }
  }

  // 기존 전화번호/이메일 확인 후 OTP 전송
  async sendOtpForExistingUser(key: string, cache = false): Promise<void> {
    const user = await this.usersService.findByUniqueKey({ where: { key } });
    if (!user) {
      throw new NotFoundException('Record associated with the key not found');
    }
    const otp = cache
      ? await this._generateOtpWithCache(key)
      : await this._generateOtp(key);

    if (key === 'phone') {
      await this._sendSmsTo(key, otp);
    } else {
      await this._sendEmailTemplateTo(key, otp);
    }
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
    const genderEnum: Gender | null = dto.gender
      ? dto.gender.toLowerCase().startsWith('f')
        ? Gender.FEMALE
        : Gender.MALE
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

  _getCacheKey(key: string): string {
    return `${this.env}:user:${key}:key`;
  }

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
      expiresIn: '1d', // todo. change it to '30m' in production
    };
    const refreshTokenOptions = {
      secret: process.env.REFRESH_TOKEN_SECRET ?? 'REFRESH-TOKEN-SECRET',
      expiresIn: '30d',
    };
    const now = moment();
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, accessTokenOptions),
      this.jwtService.signAsync(payload, refreshTokenOptions),
    ]);

    return {
      accessToken,
      accessTokenExpiry: now.clone().add(1, 'd').unix(),
      refreshToken,
      refreshTokenExpiry: now.clone().add(30, 'd').unix(),
    };
  }

  //?-------------------------------------------------------------------------//
  //? with Database
  //?-------------------------------------------------------------------------//

  async _generateOtp(key: string, length = 6): Promise<string> {
    const otp = random.generate({ length, charset: 'numeric' });
    try {
      const dto = { key, otp } as CreateSecretDto;
      const secret = await this.secretsService.create(dto);
      return secret.otp;
    } catch (e) {
      const dto = { otp } as UpdateSecretDto;
      const secret = await this.secretsService.updateByKey(key, dto);
      return secret.otp;
    }
  }

  async checkOtp(key: string, otp: string): Promise<void> {
    const secret = await this.secretsService.findByKey(key);
    if (!secret) {
      throw new BadRequestException('otp expired');
    } else if (secret.otp !== otp) {
      throw new BadRequestException('otp mismatched');
    }
  }

  //?-------------------------------------------------------------------------//
  //? with Cache
  //?-------------------------------------------------------------------------//

  async _generateOtpWithCache(key: string, length = 6): Promise<string> {
    const otp = random.generate({ length, charset: 'numeric' });
    const cacheKey = this._getCacheKey(key);
    await this.cacheManager.set(cacheKey, otp, 60 * 10);
    return otp;
  }

  async checkOtpWithCache(key: string, otp: string): Promise<void> {
    const cacheKey = this._getCacheKey(key);
    const cachedOtp = await this.cacheManager.get(cacheKey);
    if (!cachedOtp) {
      throw new BadRequestException('otp expired');
    } else if (cachedOtp !== otp) {
      throw new BadRequestException('otp mismatched');
    }
  }

  //?-------------------------------------------------------------------------//
  //? send SMS or email
  //?-------------------------------------------------------------------------//

  async _sendSmsTo(phone: string, otp: string): Promise<any> {
    const body = `미소 인증코드 ${otp}`;
    try {
      await this.smsClient.send({
        to: phone,
        content: body,
      });
    } catch (e) {
      console.log(e);
      throw new BadRequestException('aws-ses error');
    }
  }

  async _sendEmailTemplateTo(email: string, otp: string): Promise<any> {
    const params = {
      Destination: {
        CcAddresses: [],
        ToAddresses: [email],
      },
      Source: 'Flea Auction <no-reply@fleaauction.world>',
      Template: 'EmailCodeTemplate',
      TemplateData: `{ "code": "${otp}" }`,
    };
    try {
      return await this.ses.sendTemplatedEmail(params).promise();
    } catch (e) {
      console.log(e);
      throw new BadRequestException('aws-ses error');
    }
  }

  async _sendEmailTo(email: string, message: string): Promise<any> {
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

    const otp = await this._generateOtpWithCache(key);
    this._sendEmailTemplateTo(email, otp);
  }
}
