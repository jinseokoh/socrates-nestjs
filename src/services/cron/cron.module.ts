import { Module } from '@nestjs/common';
import { RABBITMQ_CLIENT, REDIS_PUBSUB_CLIENT } from 'src/common/constants';
import { CronController } from 'src/services/cron/cron.controller';
import { CronService } from 'src/services/cron/cron.service';
import { RmqModule } from 'src/services/rabbitmq/rmq.module';
import { RedisModule } from 'src/services/redis/redis.module';
@Module({
  imports: [
    RmqModule.register({ name: RABBITMQ_CLIENT }),
    RedisModule.register({ name: REDIS_PUBSUB_CLIENT }),
  ],
  providers: [CronService],
  controllers: [CronController], // to test out RMQ client. can be removed later.
})
export class CronModule {}
