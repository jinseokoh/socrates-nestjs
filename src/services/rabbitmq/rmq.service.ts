import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RmqContext, RmqOptions, Transport } from '@nestjs/microservices';
import { IRmqConfig } from 'src/common/interfaces';

@Injectable()
export class RmqService {
  constructor(private readonly configService: ConfigService) {}

  getRmqOptions(): RmqOptions {
    const rmqConfig = this.configService.get<IRmqConfig>('rabbitmq');
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
  }

  ack(context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();
    channel.ack(originalMessage);
  }
}
