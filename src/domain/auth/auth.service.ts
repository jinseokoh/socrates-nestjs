import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { SES } from 'aws-sdk';
import { ConfigService } from '@nestjs/config';
import { AWS_SES_CONNECTION } from 'src/common/constants';
import { Gender } from 'src/common/enums/gender';
import { ResetPasswordDto } from 'src/domain/auth/dto/reset-password.dto';
import { UserCredentialsDto } from 'src/domain/auth/dto/user-credentials.dto';
import { UserSocialIdDto } from 'src/domain/auth/dto/user-social-id.dto';
import { Tokens } from 'src/common/types';
import { CreateUserDto } from 'src/domain/users/dto/create-user.dto';
import { User } from 'src/domain/users/entities/user.entity';
import { ProvidersService } from 'src/domain/users/providers.service';
import { UsersService } from 'src/domain/users/users.service';
import { nameUserRandomly } from 'src/helpers/random-username';
import { SecretsService } from 'src/domain/secrets/secrets.service';
import { SmsClient } from '@nestjs-packages/ncp-sens';
import { Response as ExpressResponse } from 'express';
@Injectable()
export class AuthService {
  private readonly env: any;
  constructor(
    private readonly usersService: UsersService,
    private readonly providersService: ProvidersService,
    private readonly secretsService: SecretsService,
    private readonly jwtService: JwtService,

    @Inject(AWS_SES_CONNECTION) private readonly ses: SES,
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

  // async verifyPhoneNumberWithOtp(phone: string): Promise<string> {
  //   const user = await this.usersService.findByUniqueKey({
  //     where: { phone },
  //   });
  //   if (user) {
  //     throw new BadRequestException('phone already taken');
  //   }

  //   return await this._generateOtp(phone);
  // }

  //?-------------------------------------------------------------------------//
  //? Public) 이메일 (가입/비번)
  //?-------------------------------------------------------------------------//

  // 이메일 가입 w/ Credentials
  async register(dto: UserCredentialsDto): Promise<Tokens> {
    const user = await this.usersService.create(<CreateUserDto>dto);
    const tokens = await this._getTokens(user);
    const refreshTokenHash = tokens.refreshToken
      ? await bcrypt.hash(tokens.refreshToken, 10)
      : null;
    const username = nameUserRandomly(user.id);

    await this.usersService.update(user.id, {
      username,
      refreshTokenHash,
    });

    return tokens;
  }

  //?-------------------------------------------------------------------------//
  //? Public) 소셜 로그인
  //?-------------------------------------------------------------------------//

  // Firebase Auth 소셜인증
  async socialize(dto: UserSocialIdDto): Promise<Tokens> {
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
      const refreshTokenHash = tokens.refreshToken
        ? await bcrypt.hash(tokens.refreshToken, 10)
        : null;
      await this.usersService.update(provider.user.id, {
        refreshTokenHash,
      });

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
      const refreshTokenHash = tokens.refreshToken
        ? await bcrypt.hash(tokens.refreshToken, 10)
        : null;
      await this.usersService.update(registeredUser.id, {
        refreshTokenHash,
        isActive: true,
      });

      return tokens;
    }
    // in case user w/ firebase-email not found
    const createUserDto = new CreateUserDto();
    createUserDto.email = dto.email;
    createUserDto.gender = dto.gender
      ? dto.gender.toLowerCase().startsWith('f')
        ? Gender.FEMALE
        : Gender.MALE
      : null;
    createUserDto.isActive = true;
    const user = await this.usersService.create(createUserDto);
    await this.providersService.create({ ...dto, userId: user.id });
    const tokens = await this._getTokens(user);
    const refreshTokenHash = tokens.refreshToken
      ? await bcrypt.hash(tokens.refreshToken, 10)
      : null;
    const username = nameUserRandomly(user.id);

    await this.usersService.update(user.id, {
      username,
      refreshTokenHash,
    });
    return tokens;
  }

  //?-------------------------------------------------------------------------//
  //? Public) 로그인
  //?-------------------------------------------------------------------------//

  // 로그인 w/ Credentials
  async login(dto: UserCredentialsDto): Promise<Tokens> {
    const user = await this.validateUser(dto);
    const tokens = await this._getTokens(user);
    const refreshTokenHash = tokens.refreshToken
      ? await bcrypt.hash(tokens.refreshToken, 10)
      : null;
    await this.usersService.update(user.id, {
      refreshTokenHash,
    });

    return tokens;
  }

  //?-------------------------------------------------------------------------//
  //? Private) 로그아웃
  //?-------------------------------------------------------------------------//

  async logout(id: number): Promise<void> {
    await this.usersService.update(id, {
      refreshTokenHash: null,
    });
  }

  //?-------------------------------------------------------------------------//
  //? Public) 토큰 refresh
  //?-------------------------------------------------------------------------//

  async refreshToken(id: number, refreshToken: string | null): Promise<Tokens> {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new ForbiddenException('access denied');
    }
    if (!user.refreshTokenHash) {
      throw new ForbiddenException('authentication required');
    }
    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash,
    );
    if (!refreshTokenMatches) {
      throw new ForbiddenException('invalid refresh token');
    }
    const tokens = await this._getTokens(user);
    const refreshTokenHash = tokens.refreshToken
      ? await bcrypt.hash(tokens.refreshToken, 10)
      : null;
    await this.usersService.update(user.id, {
      refreshTokenHash,
    });

    return tokens;
  }

  // 이메일 확인코드 확인 후 비밀번호 갱신
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
  //? Cookies
  //?-------------------------------------------------------------------------//

  storeTokensInCookie(res: ExpressResponse, authToken: Tokens) {
    const ONE_MIN = 1000 * 60;
    const ONE_HOUR = 1000 * 60 * 60;
    const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30;
    res.cookie('access_token', authToken.accessToken, {
      maxAge: ONE_HOUR,
      httpOnly: true,
    });
    res.cookie('refresh_token', authToken.refreshToken, {
      maxAge: THIRTY_DAYS,
      httpOnly: true,
    });
  }

  //?-------------------------------------------------------------------------//
  //? Privates
  //?-------------------------------------------------------------------------//

  async _getTokens(user: User): Promise<Tokens> {
    const payload = {
      name: user.email,
      sub: user.id,
    };
    const accessTokenOptions = {
      secret: this.configService.get('jwt.authSecret'),
      expiresIn: '1h', // change this window to '1h' if you want
    };
    const refreshTokenOptions = {
      secret: this.configService.get('jwt.refreshSecret'),
      expiresIn: '30d',
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, accessTokenOptions),
      this.jwtService.signAsync(payload, refreshTokenOptions),
    ]);

    // const now = moment();
    return {
      accessToken,
      refreshToken,
      // accessTokenExpiry: now.clone().add(1, 'd').unix(),
      // refreshTokenExpiry: now.clone().add(30, 'd').unix(),
    };
  }

  //--------------------------------------------------------------------------//
  // @deprecated
  //--------------------------------------------------------------------------//

  // async forgotPassword(email: string): Promise<void> {
  //   const user = await this.usersService.findByUniqueKey({ where: { email } });
  //   if (!user) {
  //     throw new NotFoundException('email not found');
  //   }
  //   const key = `${this.env}:user:${user.id}:otp`;
  //   const value = await this.cacheManager.get(key);
  //   if (value) {
  //     throw new BadRequestException('too many attempts');
  //   }

  //   const otp = await this._generateOtpWithCache(key);
  //   this._sendEmailTemplateTo(email, otp);
  // }
}
