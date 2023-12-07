import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { verify } from 'jsonwebtoken';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';

@Injectable()
export class SocketIoJwtGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {

    console.log(`validation calls from socketIoJwtGuard`);

    if (context.getType() !== 'ws') {
      return true;
    }

    console.log(`validation calls from socketIoJwtGuard`);

    const client: Socket = context.switchToWs().getClient();
    SocketIoJwtGuard.validateToken(client);

    return true;
  }

  static validateToken(client: Socket) {
    const { authorization } = client.handshake.headers;
    const token: string = authorization.split(' ')[1];

    console.log(`token`, token);
    console.log(`env secret`, process.env.AUTH_TOKEN_SECRET);

    const payload = verify(token, process.env.AUTH_TOKEN_SECRET);

    return payload;
  }
}
