import { Socket } from 'socket.io';
import { SocketIoJwtGuard } from 'src/websockets/socketio-jwt.guard';

export type TWebsocketMiddleware = {
  (client: Socket, next: (err?: Error) => void);
};

export const SocketIoJwtMiddleware = (): TWebsocketMiddleware => {
  return (client, next) => {
    try {
      SocketIoJwtGuard.validateToken(client);
      next();
    } catch (error) {
      next(error);
    }
  };
};
