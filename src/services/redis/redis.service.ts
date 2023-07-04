import { Injectable } from '@nestjs/common';
import { RedisContext, RedisOptions, Transport } from '@nestjs/microservices';
import { IRedisConfig } from 'src/common/interfaces';

@Injectable()
export class RedisService {
  ack(context: RedisContext) {
    const channel = context.getChannel();
    // no acknowlege is available
  }
}
