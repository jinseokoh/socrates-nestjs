import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'refresh') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.REFRESH_TOKEN_SECRET ?? 'REFRESH-TOKEN-SECRET',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any): Promise<any> {
    // const user = await this.usersService.findOneById(payload.sub)
    const refreshToken = req.get('authorization').replace('Bearer', '').trim();
    const user = {
      id: payload.sub,
      email: payload.name,
      refreshToken,
    };

    return user;
  }
}
