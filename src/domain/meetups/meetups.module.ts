import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Career } from 'src/domain/careers/entities/career.entity';
import { Category } from 'src/domain/categories/entities/category.entity';
import { Comment } from 'src/domain/feeds/entities/comment.entity';
import { Feed } from 'src/domain/feeds/entities/feed.entity';
import { Flag } from 'src/domain/flags/entities/flag.entity';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { Thread } from 'src/domain/meetups/entities/thread.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Venue } from 'src/domain/venues/entities/venue.entity';
import { MeetupThreadsController } from 'src/domain/meetups/meetup-threads.controller';
import { MeetupUsersController } from 'src/domain/meetups/meetup-users.controller';
import { MeetupsController } from 'src/domain/meetups/meetups.controller';
import { MeetupsService } from 'src/domain/meetups/meetups.service';
import { FlagsService } from 'src/domain/flags/flags.service';
import { ThreadsService } from 'src/domain/meetups/threads.service';
import { S3Module } from 'src/services/aws/s3.module';
import { FcmModule } from 'src/services/fcm/fcm.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Career,
      Category,
      Comment,
      Feed,
      Flag,
      Meetup,
      Thread,
      User,
      Venue,
    ]),
    S3Module,
    FcmModule,
  ],
  // exports: [MeetupsService], // we need this for what?
  providers: [MeetupsService, ThreadsService, FlagsService],
  controllers: [
    MeetupsController,
    MeetupUsersController,
    MeetupThreadsController,
  ],
})
export class MeetupsModule {}
