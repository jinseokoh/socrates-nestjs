import { FeedFeedLink } from './../feeds/entities/feed_feed_link.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BookmarkUserFeed } from 'src/domain/users/entities/bookmark_user_feed.entity';
import { BookmarkUserMeetup } from 'src/domain/users/entities/bookmark_user_meetup.entity';
import { BookmarkUserUser } from 'src/domain/users/entities/bookmark_user_user.entity';
import { Category } from 'src/domain/categories/entities/category.entity';
import { Feed } from 'src/domain/feeds/entities/feed.entity';
import { Flag } from 'src/domain/users/entities/flag.entity';
import { Friendship } from 'src/domain/users/entities/friendship.entity';
import { Hate } from 'src/domain/users/entities/hate.entity';
import { Join } from 'src/domain/meetups/entities/join.entity';
import { LanguageSkill } from 'src/domain/users/entities/language_skill.entity';
import { Ledger } from 'src/domain/ledgers/entities/ledger.entity';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { Plea } from 'src/domain/pleas/entities/plea.entity';
import { Poll } from 'src/domain/feeds/entities/poll.entity';
import { Profile } from 'src/domain/users/entities/profile.entity';
import { Secret } from 'src/domain/secrets/entities/secret.entity';
import { User } from 'src/domain/users/entities/user.entity';

import { UserCategoriesController } from 'src/domain/users/user-categories.controller';
import { UserFeedsController } from 'src/domain/users/user-feeds.controller';
import { UserFriendshipController } from 'src/domain/users/user-friendshp.controller';
import { UserImpressionsController } from 'src/domain/users/user-impressions.controller';
import { UserLanguagesController } from 'src/domain/users/user-languages.controller';
import { UserLedgersController } from 'src/domain/users/user-ledgers.controller';
import { UserMeetupsController } from 'src/domain/users/user-meetups.controller';
import { UserPleaController } from 'src/domain/users/user-plea.controller';
import { UsersController } from 'src/domain/users/users.controller';
import { UserSmsController } from 'src/domain/users/user-sms.controller';
import { UserUsersController } from 'src/domain/users/user-users.controller';

import { BookmarkUserFeedService } from 'src/domain/users/bookmark_user_feed.service';
import { BookmarkUserMeetupService } from 'src/domain/users/bookmark_user_meetup.service';
import { BookmarkUserUserService } from 'src/domain/users/bookmark_user_user.service';
import { FeedsService } from 'src/domain/feeds/feeds.service';
import { FlagsService } from 'src/domain/users/flags.service';
import { UserFeedsService } from 'src/domain/users/user-feeds.service';
import { UserMeetupsService } from 'src/domain/users/user-meetups.service';
import { UsersFriendshipService } from 'src/domain/users/users-friendship.service';
import { UsersLedgerService } from 'src/domain/users/users-ledger.service';
import { UsersPleaService } from 'src/domain/users/users-plea.service';
import { UsersService } from 'src/domain/users/users.service';
import { UserUsersService } from 'src/domain/users/user-users.service';

import { S3Module } from 'src/services/aws/s3.module';
import { AlarmsModule } from 'src/domain/alarms/alarms.module';
import { FcmModule } from 'src/services/fcm/fcm.module';
import { SesModule } from 'src/services/aws/ses.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { UserSubscriber } from 'src/domain/users/subscribers/user-subscriber';
import { LanguageSkillSubscriber } from 'src/domain/users/subscribers/language-skill-subscriber';
import { UserNotificationListener } from 'src/domain/users/listeners/user-notification.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Category,
      Feed,
      Flag,
      Poll,
      Friendship,
      Hate,
      Join,
      LanguageSkill,
      Ledger,
      Meetup,
      Plea,
      Profile,
      Secret,
      User,
      BookmarkUserFeed,
      BookmarkUserMeetup,
      BookmarkUserUser,
      FeedFeedLink,
    ]),
    ThrottlerModule.forRoot([
      {
        ttl: 60 * 1000,
        limit: 2,
      },
    ]),
    AlarmsModule,
    SesModule,
    S3Module,
    FcmModule,
  ],
  exports: [UsersService],
  providers: [
    BookmarkUserFeedService,
    BookmarkUserMeetupService,
    BookmarkUserUserService,
    FeedsService,
    FlagsService,
    UserFeedsService,
    UserMeetupsService,
    UsersService,
    UsersFriendshipService,
    UsersLedgerService,
    UsersPleaService,
    UserSubscriber,
    UserUsersService,
    LanguageSkillSubscriber,
    UserNotificationListener,
  ],
  controllers: [
    UsersController,
    UserCategoriesController,
    UserFeedsController,
    UserFriendshipController,
    UserImpressionsController,
    UserLanguagesController,
    UserLedgersController,
    UserMeetupsController,
    UserPleaController,
    UserSmsController,
    UserUsersController,
    // UserFcmController, 미사용 comment out
  ],
})
export class UsersModule {}
