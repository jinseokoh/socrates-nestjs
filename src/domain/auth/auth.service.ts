import {
  BadRequestException,
  CACHE_MANAGER,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SES } from 'aws-sdk';
import * as bcrypt from 'bcrypt';
import * as random from 'randomstring';
import { StringData } from './../../common/types/string-data.type';

import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { AWS_SES_CONNECTION } from 'src/common/constants';
import { ResetPasswordDto } from 'src/domain/auth/dto/reset-password.dto';
import { UserCredentialsDto } from 'src/domain/auth/dto/user-credentials.dto';
import { UserSocialIdDto } from 'src/domain/auth/dto/user-social-id.dto';
import { Tokens } from 'src/domain/auth/types/tokens.type';
import { ProvidersService } from 'src/domain/providers/providers.service';
import { CreateUserDto } from 'src/domain/users/dto/create-user.dto';
import { User } from 'src/domain/users/user.entity';
import { UsersService } from 'src/domain/users/users.service';
import { NamingService } from 'src/services/naming/naming.service';
@Injectable()
export class AuthService {
  private readonly env;
  constructor(
    private readonly usersService: UsersService,
    private readonly providersService: ProvidersService,
    private readonly jwtService: JwtService,
    private readonly namingService: NamingService,
    @Inject(AWS_SES_CONNECTION)
    private readonly ses: SES,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(ConfigService) private configService: ConfigService,
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  async getTokens(user: User): Promise<Tokens> {
    const payload = {
      name: user.email,
      sub: user.id,
    };
    const accessTokenOptions = {
      secret: process.env.AUTH_TOKEN_SECRET ?? 'AUTH-TOKEN-SECRET',
      expiresIn: '1d', //! change it to '15m' in production
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

  async validateUser(dto: UserCredentialsDto): Promise<User> {
    const user = await this.usersService.findByUniqueKey({
      where: { email: dto.email },
    });
    if (!user) {
      throw new ForbiddenException('Access Denied');
    }
    if (!user.password) {
      throw new ForbiddenException(`This user hasn't set a password.`);
    }
    const passwordMatches = bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new ForbiddenException('Invalid Credentials');
    }

    return user;
  }

  async register(dto: UserCredentialsDto) {
    for (let i = 1; i <= 50000; i++) {
      const name = this.namingService.getName(i);
      console.log(i, name);
    }

    // const user = await this.usersService.create(<CreateUserDto>dto);
    // const tokens = await this.getTokens(user);
    // const username = this.namingService.getName(user.id);
    // this.sendCodeEmail('chuckau@naver.com', '123456');
    // await this._updateUserName(user.id, username);
    // await this._updateUserRefreshTokenHash(user.id, tokens.refreshToken);

    // return tokens;
  }

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

    if (provider != null) {
      const tokens = await this.getTokens(provider.user);
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

    if (registeredUser != null) {
      await this.providersService.create({ ...dto, userId: registeredUser.id });
      const tokens = await this.getTokens(registeredUser);
      await this._updateUserRefreshTokenHash(
        registeredUser.id,
        tokens.refreshToken,
      );
      return tokens;
    }

    const user = await this.usersService.create(<CreateUserDto>dto);
    await this.providersService.create({ ...dto, userId: user.id });
    const tokens = await this.getTokens(user);
    await this._updateUserRefreshTokenHash(user.id, tokens.refreshToken);
    return tokens;
  }

  async login(dto: UserCredentialsDto): Promise<Tokens> {
    const user = await this.validateUser(dto);
    const tokens = await this.getTokens(user);
    await this._updateUserRefreshTokenHash(user.id, tokens.refreshToken);

    return tokens;
  }

  async googleLogin(req): Promise<any> {
    if (!req.user) {
      return 'No user from google';
    }

    return {
      message: 'User information from google',
      user: req.user,
    };
  }

  async logout(id: number) {
    return this._updateUserRefreshTokenHash(id, null);
  }

  async refreshToken(id: number, token: string | null) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new ForbiddenException('Access Denied');
    }
    if (!user.refreshTokenHash) {
      throw new ForbiddenException('Authentication required');
    }
    const refreshTokenMatches = await bcrypt.compare(
      token,
      user.refreshTokenHash,
    );
    if (!refreshTokenMatches) {
      throw new ForbiddenException('Invalid Refresh Token');
    }
    const tokens = await this.getTokens(user);
    await this._updateUserRefreshTokenHash(user.id, tokens.refreshToken);

    return tokens;
  }

  async forgotPassword(email: string): Promise<StringData> {
    const user = await this.usersService.findByUniqueKey({ where: { email } });
    if (!user) {
      throw new NotFoundException('The email not found');
    }
    const key = `${this.env}:user:${user.id}:otp`;
    const value = await this.cacheManager.get(key);
    if (value) {
      throw new BadRequestException('too many attempts');
    }
    const randomValue = random.generate({
      length: 5,
      charset: 'numeric',
    });
    const result = await this.cacheManager.set(key, randomValue);

    return { data: result };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<User> {
    const user = await this.usersService.findByUniqueKey({
      where: { email: dto.email },
    });
    if (!user) {
      throw new NotFoundException('The email not found');
    }
    const key = `${this.env}:user:${user.id}:otp`;
    const value = await this.cacheManager.get(key);
    if (!value) {
      throw new BadRequestException('otp expired');
    } else if (value !== dto.otp) {
      throw new BadRequestException('invalid otp');
    }

    const password = await bcrypt.hash(dto.password, 10);
    return await this.usersService.update(user.id, { password });
  }

  // privates
  async _updateUserName(id: number, username: string | null) {
    await this.usersService.update(id, {
      username,
    });
  }

  // privates
  async _updateUserRefreshTokenHash(id: number, token: string | null) {
    const refreshTokenHash = token ? await bcrypt.hash(token, 10) : null;
    await this.usersService.update(id, {
      refreshTokenHash,
    });
  }

  async sendCodeEmail(email: string, code: string): Promise<any> {
    const params = {
      Destination: {
        CcAddresses: [],
        ToAddresses: [email],
      },
      Source: '플리옥션 <no-replay@fleaauction.world>',
      Template: 'EmailCodeTemplate',
      TemplateData: `{ "code": ${code} }`,
      // ReplyToAddresses: ['chuck@fleaauction.co'],
    };

    return await this.ses.sendTemplatedEmail(params).promise();
  }

  async sendEmail(email: string, message: string): Promise<any> {
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
      Source: '플리옥션 <no-replay@fleaauction.world>',
      // ReplyToAddresses: ['chuck@fleaauction.co'],
    };

    return await this.ses.sendEmail(params).promise();
  }
}
