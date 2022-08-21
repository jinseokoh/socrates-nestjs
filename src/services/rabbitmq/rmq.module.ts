import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { IRmqConfig } from 'src/common/interfaces';
import { RmqService } from './rmq.service';

interface RmqModuleOptions {
  name: string;
}

@Module({
  providers: [RmqService],
  exports: [RmqService],
})
export class RmqModule {
  static register({ name }: RmqModuleOptions): DynamicModule {
    return {
      module: RmqModule,
      imports: [
        ClientsModule.registerAsync([
          {
            name,
            useFactory: async (configService: ConfigService) => {
              const rmqConfig = configService.get<IRmqConfig>('rabbitmq');
              const [protocol, uri] = `${rmqConfig.host}`.split('://');
              const queue = `${rmqConfig.queue}`;
              const queueUrl = `${protocol}://${rmqConfig.user}:${rmqConfig.password}@${uri}`;
              return {
                transport: Transport.RMQ,
                options: {
                  queue,
                  queueOptions: {
                    durable: false,
                  },
                  urls: [queueUrl],
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
