import { Injectable } from '@nestjs/common';
import { RedisContext } from '@nestjs/microservices';

@Injectable()
export class RedisService {
  ack(context: RedisContext) {
    const channel = context.getChannel();
    // no acknowlege is available
  }
}
