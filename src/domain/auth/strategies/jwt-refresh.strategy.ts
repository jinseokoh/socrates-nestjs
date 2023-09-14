import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config/dist/config.service';
import { PassportStrategy } from '@nestjs/passport';
import { Request as ExpressRequest } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'refresh') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtRefreshStrategy.extractJwtFromCookies,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.refreshSecret'),
      passReqToCallback: true,
    });
  }

  private static extractJwtFromCookies(req: ExpressRequest): string | null {
    if (req.cookies && 'refresh_token' in req.cookies) {
      return req.cookies.refresh_token;
    }
    return null;
  }

  async validate(req: ExpressRequest, payload: any): Promise<any> {
    //? read from cookies first and fallback to header
    const refreshToken =
      req.cookies?.refresh_token ??
      req.get('authorization').replace('Bearer', '').trim();
    // const user = await this.usersService.findOneById(payload.sub)
    const user = {
      id: payload.sub,
      email: payload.name,
      refreshToken,
    };

    return user;
  }
}
