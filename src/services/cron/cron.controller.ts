import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiOperation } from '@nestjs/swagger';
import { RABBITMQ_CLIENT, REDIS_PUBSUB_CLIENT } from 'src/common/constants';
@Controller('cron')
export class CronController {
  constructor(
    @Inject(RABBITMQ_CLIENT) private readonly rabbitClient: ClientProxy,
    @Inject(REDIS_PUBSUB_CLIENT) private readonly redisClient: ClientProxy,
  ) {}

  @ApiOperation({ description: 'Rabbit client 테스트' })
  @Post('rabbit')
  async rabbit(@Body('auctionId') auctionId: number): Promise<any> {
    console.log(auctionId, '<= dispatch AuctionBegan event via API');
    return await this.rabbitClient.emit('AuctionBegan', {
      auctionId,
    });
  }

  @ApiOperation({ description: 'Redis client 테스트' })
  @Post('redis')
  async redis(@Body() data: any): Promise<any> {
    console.log(data, '<= dispatch RealTime event via API');
    return await this.redisClient.emit('RealTime', data);
  }
}
