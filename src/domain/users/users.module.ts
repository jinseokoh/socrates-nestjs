import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from 'src/domain/categories/entities/category.entity';
import { Connection } from 'src/domain/connections/entities/connection.entity';
import { Friendship } from 'src/domain/users/entities/friendship.entity';
import { Hate } from 'src/domain/users/entities/hate.entity';
import { Join } from 'src/domain/meetups/entities/join.entity';
import { LanguageSkill } from 'src/domain/users/entities/language_skill.entity';
import { Like } from 'src/domain/meetups/entities/like.entity';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { Profile } from 'src/domain/users/entities/profile.entity';
import { Reaction } from 'src/domain/connections/entities/reaction.entity';
import { ReportConnection } from 'src/domain/connections/entities/report_connection.entity';
import { ReportMeetup } from 'src/domain/meetups/entities/report_meetup.entity';
import { ReportUser } from 'src/domain/users/entities/report_user.entity';
import { Secret } from 'src/domain/secrets/entities/secret.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { UsersService } from 'src/domain/users/users.service';
import { S3Module } from 'src/services/aws/s3.module';
import { FcmModule } from 'src/services/fcm/fcm.module';
import { SesModule } from 'src/services/aws/ses.module';
import { CrawlerModule } from 'src/services/crawler/crawler.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { UserUsersController } from 'src/domain/users/user-users.controller';
import { UserFcmController } from 'src/domain/users/user-fcm.controller';
import { UserCategoriesController } from 'src/domain/users/user-categories.controller';
import { UserMeetupsController } from 'src/domain/users/user-meetups.controller';
import { UserSmsController } from 'src/domain/users/user-sms.controller';
import { UsersController } from 'src/domain/users/users.controller';
import { UserConnectionsController } from 'src/domain/users/user-connections.controller';
import { UserImpressionsController } from 'src/domain/users/user-impressions.controller';
import { UserLanguagesController } from 'src/domain/users/user-languages.controller';
import { UserSubscriber } from 'src/domain/users/subscribers/user-subscriber';
import { LanguageSkillSubscriber } from 'src/domain/users/subscribers/language-skill-subscriber';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Category,
      LanguageSkill,
      Like,
      Join,
      Hate,
      Reaction,
      ReportConnection,
      ReportMeetup,
      ReportUser,
      Secret,
      Profile,
      User,
      Friendship,
      Connection,
      Meetup,
    ]),
    ThrottlerModule.forRoot([
      {
        ttl: 60 * 1000,
        limit: 2,
      },
    ]),
    SesModule,
    S3Module,
    FcmModule,
  ],
  exports: [UsersService],
  providers: [UsersService, UserSubscriber, LanguageSkillSubscriber],
  controllers: [
    UsersController,
    UserCategoriesController,
    UserImpressionsController,
    UserLanguagesController,
    UserMeetupsController,
    UserConnectionsController,
    UserUsersController,
    UserFcmController,
    UserSmsController,
  ],
})
export class UsersModule {}
