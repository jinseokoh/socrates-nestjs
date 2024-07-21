import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedCommentsController } from 'src/domain/feeds/feed-comments.controller';
import { FeedsController } from 'src/domain/feeds/feeds.controller';
import { FeedsService } from 'src/domain/feeds/feeds.service';
import { PollsController } from 'src/domain/feeds/polls.controller';
import { PollsService } from 'src/domain/feeds/polls.service';
import { Poll } from 'src/domain/feeds/entities/poll.entity';
import { Comment } from 'src/domain/feeds/entities/comment.entity';
import { Plea } from 'src/domain/pleas/entities/plea.entity';
import { FeedCommentsService } from 'src/domain/feeds/feed-comments.service';
import { Feed } from 'src/domain/feeds/entities/feed.entity';
import { S3Module } from 'src/services/aws/s3.module';
import { FcmModule } from 'src/services/fcm/fcm.module';
import { FeedFeedLink } from 'src/domain/feeds/entities/feed_feed_link.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Feed, Poll, Comment, Plea, FeedFeedLink]),
    S3Module,
    FcmModule,
  ],
  // exports: [FeedsService],
  providers: [FeedsService, FeedCommentsService, PollsService],
  controllers: [PollsController, FeedsController, FeedCommentsController],
})
export class FeedsModule {}
