import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from 'src/domain/categories/entities/category.entity';
import { Connection } from 'src/domain/dots/entities/connection.entity';
import { Friendship } from 'src/domain/users/entities/friendship.entity';
import { Hate } from 'src/domain/users/entities/hate.entity';
import { Join } from 'src/domain/meetups/entities/join.entity';
import { LanguageSkill } from 'src/domain/users/entities/language_skill.entity';
import { Like } from 'src/domain/meetups/entities/like.entity';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { Profile } from 'src/domain/users/entities/profile.entity';
import { Reaction } from 'src/domain/dots/entities/reaction.entity';
import { ReportConnection } from 'src/domain/dots/entities/report_connection.entity';
import { ReportMeetup } from 'src/domain/meetups/entities/report_meetup.entity';
import { ReportUser } from 'src/domain/users/entities/report_user.entity';
import { Secret } from 'src/domain/secrets/entities/secret.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { UsersService } from 'src/domain/users/users.service';
import { S3Module } from 'src/services/aws/s3.module';
import { FcmModule } from 'src/services/fcm/fcm.module';
import { SesModule } from 'src/services/aws/ses.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { UserUsersController } from 'src/domain/users/user-users.controller';
import { UserCategoriesController } from 'src/domain/users/user-categories.controller';
import { UserMeetupsController } from 'src/domain/users/user-meetups.controller';
import { UserSmsController } from 'src/domain/users/user-sms.controller';
import { UsersController } from 'src/domain/users/users.controller';
import { UserConnectionsController } from 'src/domain/users/user-connections.controller';
import { UserImpressionsController } from 'src/domain/users/user-impressions.controller';
import { UserLanguagesController } from 'src/domain/users/user-languages.controller';
import { UserSubscriber } from 'src/domain/users/subscribers/user-subscriber';
import { LanguageSkillSubscriber } from 'src/domain/users/subscribers/language-skill-subscriber';
import { Flag } from 'src/domain/users/entities/flag.entity';
import { Plea } from 'src/domain/pleas/entities/plea.entity';
import { Dot } from 'src/domain/dots/entities/dot.entity';
import { UserFriendshipController } from 'src/domain/users/user-friendshp.controller';
import { UsersFriendshipService } from 'src/domain/users/users-friendship.service';
import { UsersConnectionService } from 'src/domain/users/users-connection.service';
import { UsersMeetupService } from 'src/domain/users/users-meetup.service';
import { UsersUserService } from 'src/domain/users/users-user.service';
import { UserLedgersController } from 'src/domain/users/user-ledgers.controller';
import { UsersLedgerService } from 'src/domain/users/users-ledger.service';
import { Ledger } from 'src/domain/ledgers/entities/ledger.entity';
import { UserPleaController } from 'src/domain/users/user-plea.controller';
import { UsersPleaService } from 'src/domain/users/users-plea.service';
import { UserNotificationListener } from 'src/domain/users/listeners/user-notification.listener';
import { AlarmsModule } from 'src/domain/alarms/alarms.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Category,
      Connection,
      Dot,
      Flag,
      Friendship,
      Hate,
      Join,
      LanguageSkill,
      Ledger,
      Like,
      Meetup,
      Plea,
      Profile,
      Reaction,
      ReportConnection,
      ReportMeetup,
      ReportUser,
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
    UsersService,
    UsersConnectionService,
    UsersFriendshipService,
    UsersLedgerService,
    UsersMeetupService,
    UsersPleaService,
    UserSubscriber,
    UsersUserService,
    LanguageSkillSubscriber,
    UserNotificationListener,
  ],
  controllers: [
    UsersController,
    UserCategoriesController,
    UserConnectionsController,
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
