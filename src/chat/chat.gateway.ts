import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';

@WebSocketGateway(4002, { cors: '*' })
export class ChatGateway {
  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): string {
    return 'Hello world!';
  }
}
