import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request as ExpressRequest } from 'express';
import { ConfigService } from '@nestjs/config/dist/config.service';
@Injectable()
export class JwtAuthStrategy extends PassportStrategy(Strategy, 'auth') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtAuthStrategy.extractJwtFromCookies,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.authSecret'),
    });
  }

  private static extractJwtFromCookies(req: ExpressRequest): string | null {
    if (req.cookies && 'access_token' in req.cookies) {
      return req.cookies.access_token;
    }
    return null;
  }

  async validate(payload: any): Promise<any> {
    // if (payload === null) {
    //   throw new UnauthorizedException();
    // }
    // const user = await this.usersService.findOneById(payload.sub)
    const user = {
      id: payload.sub,
      email: payload.name,
    };

    return user;
  }
}
