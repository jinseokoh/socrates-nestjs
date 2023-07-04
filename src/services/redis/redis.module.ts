import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { REDIS_PUBSUB_CLIENT } from 'src/common/constants';

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: REDIS_PUBSUB_CLIENT,
        inject: [ConfigService],
        useFactory: async (configService: ConfigService) => {
          return {
            transport: Transport.REDIS,
            options: {
              host: configService.get('redis.host'),
              port: configService.get('redis.port'),
            },
          };
        },
      },
    ]),
  ],
})
export class RedisModule {}
