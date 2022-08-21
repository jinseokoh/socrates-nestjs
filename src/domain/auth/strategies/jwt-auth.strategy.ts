import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
@Injectable()
export class JwtAuthStrategy extends PassportStrategy(Strategy, 'auth') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.AUTH_TOKEN_SECRET ?? 'AUTH-TOKEN-SECRET',
    });
  }

  async validate(payload: any): Promise<any> {
    // const user = await this.usersService.findOneById(payload.sub)
    const user = {
      id: payload.sub,
      email: payload.name,
    };

    return user;
  }
}
