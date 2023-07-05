import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RedisService } from 'src/services/redis/redis.service';

interface IRedisModuleOptions {
  name: string;
}

@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {
  static register({ name }: IRedisModuleOptions): DynamicModule {
    return {
      module: RedisModule,
      imports: [
        ClientsModule.registerAsync([
          {
            name,
            useFactory: async (configService: ConfigService) => {
              return {
                transport: Transport.REDIS,
                options: {
                  host: configService.get('redis.host'),
                  port: configService.get('redis.port'),
                },
              };
            },
            inject: [ConfigService],
          },
        ]),
      ],
      exports: [ClientsModule],
    };
  }
}
