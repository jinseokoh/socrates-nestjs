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
import { Plea } from 'src/domain/feeds/entities/plea.entity';
import { Poll } from 'src/domain/feeds/entities/poll.entity';
import { Profile } from 'src/domain/users/entities/profile.entity';
import { Secret } from 'src/domain/secrets/entities/secret.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { FeedLink } from 'src/domain/feeds/entities/feed_link.entity';

import { UserCategoriesController } from 'src/domain/users/user-categories.controller';
import { UserFeedsController } from 'src/domain/users/user-feeds.controller';
import { UserFriendshipController } from 'src/domain/users/user-friends.controller';
import { UserHatesController } from 'src/domain/users/user-hates.controller';
import { UserImpressionsController } from 'src/domain/users/user-impressions.controller';
import { UserJoinsController } from 'src/domain/users/user-joins.controller';
import { UserLanguagesController } from 'src/domain/users/user-languages.controller';
import { UserLedgersController } from 'src/domain/users/user-ledgers.controller';
import { UserMeetupsController } from 'src/domain/users/user-meetups.controller';
import { UserPleaController } from 'src/domain/users/user-plea.controller';
import { UserPleasController } from 'src/domain/users/user-pleas.controller';
import { UsersController } from 'src/domain/users/users.controller';
import { UserSmsController } from 'src/domain/users/user-sms.controller';
import { UserUsersController } from 'src/domain/users/user-users.controller';

import { BookmarkUserFeedService } from 'src/domain/users/bookmark_user_feed.service';
import { BookmarkUserMeetupService } from 'src/domain/users/bookmark_user_meetup.service';
import { BookmarkUserUserService } from 'src/domain/users/bookmark_user_user.service';
import { FeedsService } from 'src/domain/feeds/feeds.service';
import { FlagFeedService } from 'src/domain/users/flag_feed.service';
import { FlagMeetupService } from 'src/domain/users/flag_meetup.service';
import { FlagUserService } from 'src/domain/users/flag_user.service';
import { UserCategoriesService } from 'src/domain/users/user-categories.service';
import { UserFeedsService } from 'src/domain/users/user-feeds.service';
import { UserFriendsService } from 'src/domain/users/user-friends.service';
import { UserHatesService } from 'src/domain/users/user-hates.service';
import { UserImpressionsService } from 'src/domain/users/user-impressions.service';
import { UserJoinsService } from 'src/domain/users/user-joins.service';
import { UserLanguagesService } from 'src/domain/users/user-languages.service';
import { UserMeetupsService } from 'src/domain/users/user-meetups.service';
import { UserPleasService } from 'src/domain/users/user-pleas.service';
import { UsersLedgerService } from 'src/domain/users/users-ledger.service';
import { UsersPleaService } from 'src/domain/users/users-plea.service';
import { UsersService } from 'src/domain/users/users.service';

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
      BookmarkUserFeed,
      BookmarkUserMeetup,
      BookmarkUserUser,
      Category,
      Feed,
      FeedLink,
      Flag,
      Friendship,
      Hate,
      Join,
      LanguageSkill,
      Ledger,
      Meetup,
      Plea,
      Poll,
      Profile,
      Secret,
      User,
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
    FlagFeedService,
    FlagMeetupService,
    FlagUserService,
    UserCategoriesService,
    UserFeedsService,
    UserFriendsService,
    UserHatesService,
    UserImpressionsService,
    UserJoinsService,
    UserLanguagesService,
    UserMeetupsService,
    UserNotificationListener,
    UserPleasService,
    UsersLedgerService,
    UsersPleaService,
    UsersService,
    LanguageSkillSubscriber,
    UserSubscriber,
  ],
  controllers: [
    // UserFcmController, 미사용 comment out
    UserCategoriesController,
    UserFeedsController,
    UserFriendshipController,
    UserHatesController,
    UserImpressionsController,
    UserJoinsController,
    UserLanguagesController,
    UserLedgersController,
    UserMeetupsController,
    UserPleaController,
    UserPleasController,
    UsersController,
    UsersController,
    UserSmsController,
    UserUsersController,
  ],
})
export class UsersModule {}
