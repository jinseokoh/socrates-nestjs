import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedRemarksController } from 'src/domain/feeds/feed-remarks.controller';
import { FeedsController } from 'src/domain/feeds/feeds.controller';
import { FeedsService } from 'src/domain/feeds/feeds.service';
import { DotsController } from 'src/domain/feeds/dots.controller';
import { DotsService } from 'src/domain/feeds/dots.service';
import { Dot } from 'src/domain/feeds/entities/dot.entity';
import { Remark } from 'src/domain/feeds/entities/remark.entity';
import { Plea } from 'src/domain/pleas/entities/plea.entity';
import { Faction } from 'src/domain/factions/entities/faction.entity';
import { RemarksService } from 'src/domain/feeds/remarks.service';
import { Feed } from 'src/domain/feeds/entities/feed.entity';
import { S3Module } from 'src/services/aws/s3.module';
import { FcmModule } from 'src/services/fcm/fcm.module';
import { FeedSubscriber } from 'src/domain/feeds/subscribers/feed-subscriber';
@Module({
  imports: [
    TypeOrmModule.forFeature([Dot, Feed, Remark, Plea, Faction]),
    S3Module,
    FcmModule,
  ],
  providers: [
    DotsService,
    FeedsService,
    RemarksService,
    FeedSubscriber,
  ],
  controllers: [
    DotsController,
    FeedsController,
    FeedRemarksController,
  ],
})
export class DotsModule {}
