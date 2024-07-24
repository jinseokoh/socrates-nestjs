import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedsService } from 'src/domain/feeds/feeds.service';
import { FeedCommentsService } from 'src/domain/feeds/feed-comments.service';
import { FlagFeedService } from 'src/domain/users/flag_feed.service';
import { FlagMeetupService } from 'src/domain/users/flag_meetup.service';
import { FlagUserService } from 'src/domain/users/flag_user.service';
import { PollsService } from 'src/domain/feeds/polls.service';
import { BookmarkUserFeedService } from 'src/domain/users/bookmark_user_feed.service';
import { BookmarkUserFeed } from 'src/domain/users/entities/bookmark_user_feed.entity';
import { FeedComment } from 'src/domain/feeds/entities/feed_comment.entity';
import { Feed } from 'src/domain/feeds/entities/feed.entity';
import { FeedLink } from 'src/domain/feeds/entities/feed_link.entity';
import { Flag } from 'src/domain/users/entities/flag.entity';
import { Plea } from 'src/domain/feeds/entities/plea.entity';
import { Poll } from 'src/domain/feeds/entities/poll.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { FeedCommentsController } from 'src/domain/feeds/feed-comments.controller';
import { FeedUsersController } from 'src/domain/feeds/feed-users.controller';
import { FeedsController } from 'src/domain/feeds/feeds.controller';
import { PollsController } from 'src/domain/feeds/polls.controller';
import { S3Module } from 'src/services/aws/s3.module';
import { FcmModule } from 'src/services/fcm/fcm.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BookmarkUserFeed,
      FeedComment,
      Feed,
      FeedLink,
      Flag,
      Plea,
      Poll,
      User,
    ]),
    FcmModule,
    S3Module,
  ],
  // exports: [FeedsService],
  providers: [
    BookmarkUserFeedService,
    FeedCommentsService,
    FeedsService,
    FlagFeedService,
    PollsService,
  ],
  controllers: [
    FeedCommentsController,
    FeedsController,
    FeedUsersController,
    PollsController,
  ],
})
export class FeedsModule {}
