import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Bookmark } from 'src/domain/users/entities/bookmark.entity';
import { Category } from 'src/domain/categories/entities/category.entity';
import { Feed } from 'src/domain/feeds/entities/feed.entity';
import { Flag } from 'src/domain/users/entities/flag.entity';
import { Fluency } from 'src/domain/languages/entities/fluency.entity';
import { Friendship } from 'src/domain/users/entities/friendship.entity';
import { Hate } from 'src/domain/users/entities/hate.entity';
import { Interest } from 'src/domain/users/entities/interest.entity';
import { Join } from 'src/domain/meetups/entities/join.entity';
import { Language } from 'src/domain/languages/entities/language.entity';
import { Ledger } from 'src/domain/ledgers/entities/ledger.entity';
import { Like } from 'src/domain/users/entities/like.entity';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { Plea } from 'src/domain/icebreakers/entities/plea.entity';
import { Poll } from 'src/domain/icebreakers/entities/poll.entity';
import { Profile } from 'src/domain/users/entities/profile.entity';
import { Provider } from 'src/domain/users/entities/provider.entity';
import { Secret } from 'src/domain/users/entities/secret.entity';
import { User } from 'src/domain/users/entities/user.entity';

import { FeedsService } from 'src/domain/feeds/feeds.service';
import { FlagFeedService } from 'src/domain/users/flag_feed.service';
import { FlagMeetupService } from 'src/domain/users/flag_meetup.service';
import { ProfilesService } from 'src/domain/users/profiles.service';
import { ProvidersService } from 'src/domain/users/providers.service';
import { UserCategoriesService } from 'src/domain/users/user-categories.service';
import { UserFeedsService } from 'src/domain/users/user-feeds.service';
import { UserFriendsService } from 'src/domain/users/user-friends.service';
import { UserHatesService } from 'src/domain/users/user-hates.service';
import { UserImpressionsService } from 'src/domain/users/user-impressions.service';
import { UserJoinsService } from 'src/domain/users/user-joins.service';
import { UserLanguagesService } from 'src/domain/users/user-languages.service';
import { UserLedgersService } from 'src/domain/users/user-ledgers.service';
import { UserMeetupsService } from 'src/domain/users/user-meetups.service';
import { UserOtpsService } from 'src/domain/users/user-otps.service';
import { UserPleasService } from 'src/domain/users/user-pleas.service';
import { UserUsersService } from 'src/domain/users/user-users.service';
import { UsersService } from 'src/domain/users/users.service';

import { UserCategoriesController } from 'src/domain/users/user-categories.controller';
import { UserFeedsController } from 'src/domain/users/user-feeds.controller';
import { UserFriendshipController } from 'src/domain/users/user-friends.controller';
import { UserHatesController } from 'src/domain/users/user-hates.controller';
import { UserImpressionsController } from 'src/domain/users/user-impressions.controller';
import { UserJoinsController } from 'src/domain/users/user-joins.controller';
import { UserLanguagesController } from 'src/domain/users/user-languages.controller';
import { UserLedgersController } from 'src/domain/users/user-ledgers.controller';
import { UserMeetupsController } from 'src/domain/users/user-meetups.controller';
import { UserOtpsController } from 'src/domain/users/user-otps.controller';
import { UserPleasController } from 'src/domain/users/user-pleas.controller';
import { UserUsersController } from 'src/domain/users/user-users.controller';
import { UsersController } from 'src/domain/users/users.controller';

import { S3Module } from 'src/services/aws/s3.module';
import { AlarmsModule } from 'src/domain/alarms/alarms.module';
import { FcmModule } from 'src/services/fcm/fcm.module';
import { SesModule } from 'src/services/aws/ses.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { UserSubscriber } from 'src/domain/users/subscribers/user-subscriber';
import { FluencySubscriber } from 'src/domain/users/subscribers/language-skill-subscriber';
import { UserNotificationListener } from 'src/domain/users/listeners/user-notification.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Bookmark,
      Category,
      Feed,
      Flag,
      Friendship,
      Hate,
      Interest,
      Join,
      Language,
      Like,
      Fluency,
      Ledger,
      Meetup,
      Plea,
      Poll,
      Profile,
      Provider,
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
  exports: [UsersService, ProvidersService], // being used in auth.module.ts
  providers: [
    FeedsService,
    FlagFeedService,
    FlagMeetupService,
    ProfilesService,
    ProvidersService,
    UserCategoriesService,
    UserFeedsService,
    UserFriendsService,
    UserHatesService,
    UserImpressionsService,
    UserJoinsService,
    UserLanguagesService,
    UserMeetupsService,
    UserNotificationListener,
    UserOtpsService,
    UserPleasService,
    UserLedgersService,
    UserUsersService,
    UsersService,
    FluencySubscriber,
    UserSubscriber,
  ],
  controllers: [
    UserCategoriesController,
    UserFeedsController,
    UserFriendshipController,
    UserHatesController,
    UserImpressionsController,
    UserJoinsController,
    UserLanguagesController,
    UserLedgersController,
    UserMeetupsController,
    UserOtpsController,
    UserPleasController,
    UserUsersController,
    UsersController,
  ],
})
export class UsersModule {}
