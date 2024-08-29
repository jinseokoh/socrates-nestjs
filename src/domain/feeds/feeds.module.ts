import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bookmark } from 'src/domain/users/entities/bookmark.entity';
import { Feed } from 'src/domain/feeds/entities/feed.entity';
import { FeedComment } from 'src/domain/feeds/entities/feed_comment.entity';
import { FeedsService } from 'src/domain/feeds/feeds.service';
import { Flag } from 'src/domain/users/entities/flag.entity';
import { Poll } from 'src/domain/icebreakers/entities/poll.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { FeedCommentUsersController } from 'src/domain/feeds/feed_comment-users.controller';
import { FeedCommentUsersService } from 'src/domain/feeds/feed_comment-users.service';
import { FlagFeedService } from 'src/domain/users/flag_feed.service';
import { PollsService } from 'src/domain/feeds/polls.service';
import { FeedsController } from 'src/domain/feeds/feeds.controller';
import { FeedUsersController } from 'src/domain/feeds/feed-users.controller';
import { PollsController } from 'src/domain/feeds/polls.controller';
import { S3Module } from 'src/services/aws/s3.module';
import { FcmModule } from 'src/services/fcm/fcm.module';
import { FeedUsersService } from 'src/domain/feeds/feed-users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Bookmark,
      FeedComment,
      Feed,
      Flag,
      Poll,
      User,
    ]),
    FcmModule,
    S3Module,
  ],
  // exports: [FeedsService],
  providers: [
    FeedsService,
    FeedUsersService,
    FeedCommentUsersService,
    FlagFeedService,
    PollsService,
  ],
  controllers: [
    FeedsController,
    FeedCommentUsersController,
    FeedUsersController,
    PollsController,
  ],
})
export class FeedsModule {}
