import { Socket } from 'socket.io';
import { SocketIoJwtGuard } from 'src/domain/auth/guards/ws-jwt.guard';

export type SocketIoMiddleware = {
  (client: Socket, next: (err?: Error) => void);
};

export const SocketIoJwtMiddleware = (): SocketIoMiddleware => {
  return (client, next) => {
    try {
      SocketIoJwtGuard.validateToken(client);
      next();
    } catch (error) {
      next(error);
    }
  };
};
