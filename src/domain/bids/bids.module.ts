import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { REDIS_PUBSUB_CLIENT } from 'src/common/constants';
import { Auction } from 'src/domain/auctions/auction.entity';
import { Bid } from 'src/domain/bids/bid.entity';
import { BidsController } from 'src/domain/bids/bids.controller';
import { BidsService } from 'src/domain/bids/bids.service';
import { User } from 'src/domain/users/user.entity';
import { FcmModule } from 'src/services/fcm/fcm.module';
import { RedisModule } from 'src/services/redis/redis.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Bid, Auction, User]),
    FcmModule,
    RedisModule.register({ name: REDIS_PUBSUB_CLIENT }),
  ],
  providers: [BidsService],
  controllers: [BidsController],
})
export class BidsModule {}
