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
import { BookmarkUserMeetup } from 'src/domain/users/entities/bookmark_user_meetup.entity';
import { MeetupUsersController } from 'src/domain/meetups/meetup-users.controller';
import { MeetupsController } from 'src/domain/meetups/meetups.controller';
import { MeetupCommentsController } from 'src/domain/meetups/meetup-comments.controller';
import { MeetupsService } from 'src/domain/meetups/meetups.service';
import { FlagMeetupService } from 'src/domain/users/flag_meetup.service';
import { MeetupCommentsService } from 'src/domain/meetups/meetup-comments.service';
import { BookmarkUserMeetupService } from 'src/domain/users/bookmark_user_meetup.service';
import { S3Module } from 'src/services/aws/s3.module';
import { FcmModule } from 'src/services/fcm/fcm.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      BookmarkUserMeetup,
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
  providers: [
    BookmarkUserMeetupService,
    FlagMeetupService,
    MeetupsService,
    MeetupCommentsService,
  ],
  controllers: [
    MeetupsController,
    MeetupCommentsController,
    MeetupUsersController,
  ],
})
export class MeetupsModule {}
