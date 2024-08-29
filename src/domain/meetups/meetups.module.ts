import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Career } from 'src/domain/careers/entities/career.entity';
import { Category } from 'src/domain/categories/entities/category.entity';
import { FeedComment } from 'src/domain/feeds/entities/feed_comment.entity';
import { Feed } from 'src/domain/feeds/entities/feed.entity';
import { Flag } from 'src/domain/users/entities/flag.entity';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { MeetupComment } from 'src/domain/meetups/entities/meetup_comment.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Venue } from 'src/domain/meetups/entities/venue.entity';
import { Bookmark } from 'src/domain/users/entities/bookmark.entity';
import { MeetupsService } from 'src/domain/meetups/meetups.service';
import { MeetupUsersService } from 'src/domain/meetups/meetup-users.service';
import { MeetupCommentUsersService } from 'src/domain/meetups/meetup_comment-users.service';
import { MeetupsController } from 'src/domain/meetups/meetups.controller';
import { MeetupUsersController } from 'src/domain/meetups/meetup-users.controller';
import { MeetupCommentUsersController } from 'src/domain/meetups/meetup_comment-users.controller';
import { S3Module } from 'src/services/aws/s3.module';
import { FcmModule } from 'src/services/fcm/fcm.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Bookmark,
      Career,
      Category,
      FeedComment,
      Feed,
      Flag,
      Meetup,
      MeetupComment,
      User,
      Venue,
    ]),
    FcmModule,
    S3Module,
  ],
  // exports: [MeetupsService], // we need this for what?
  providers: [MeetupsService, MeetupUsersService, MeetupCommentUsersService],
  controllers: [
    MeetupsController,
    MeetupUsersController,
    MeetupCommentUsersController,
  ],
})
export class MeetupsModule {}
