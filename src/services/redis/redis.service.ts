import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisContext, RedisOptions, Transport } from '@nestjs/microservices';
import { IRedisConfig } from 'src/common/interfaces';

@Injectable()
export class RedisService {
  constructor(private readonly configService: ConfigService) {}

  getRedisOptions(): RedisOptions {
    const redisConfig = this.configService.get<IRedisConfig>('redis');
    return {
      transport: Transport.REDIS,
      options: {
        host: redisConfig.host,
        port: redisConfig.port,
      },
    };
  }

  ack(context: RedisContext) {
    const channel = context.getChannel();
    // no acknowlege is available
  }
}
