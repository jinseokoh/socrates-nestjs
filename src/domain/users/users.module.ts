import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from 'src/domain/categories/entities/category.entity';
import { LanguageSkill } from 'src/domain/users/entities/language_skill.entity';
import { Connection } from 'src/domain/connections/entities/connection.entity';
import { Abhor } from 'src/domain/connections/entities/abhor.entity';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { Like } from 'src/domain/meetups/entities/like.entity';
import { Dislike } from 'src/domain/meetups/entities/dislike.entity';
import { Join } from 'src/domain/meetups/entities/join.entity';
import { Hate } from 'src/domain/users/entities/hate.entity';
import { Profile } from 'src/domain/users/entities/profile.entity';
import { Report } from 'src/domain/users/entities/report.entity';
import { Secret } from 'src/domain/secrets/entities/secret.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { UserFcmController } from 'src/domain/users/user-fcm.controller';
import { UserCategoriesController } from 'src/domain/users/user-categories.controller';
import { UserMeetupsController } from 'src/domain/users/user-meetups.controller';
import { UserSmsController } from 'src/domain/users/user-sms.controller';
import { UsersController } from 'src/domain/users/users.controller';
import { UsersService } from 'src/domain/users/users.service';
import { CrawlerModule } from 'src/services/crawler/crawler.module';
import { S3Module } from 'src/services/aws/s3.module';
import { FcmModule } from 'src/services/fcm/fcm.module';
import { SesModule } from 'src/services/aws/ses.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { UserUsersController } from 'src/domain/users/user-users.controller';
import { UserImpressionsController } from 'src/domain/users/user-impressions.controller';
import { UserSubscriber } from 'src/domain/users/subscribers/user-subscriber';
import { UserLanguagesController } from 'src/domain/users/user-languages.controller';
import { LanguageSkillSubscriber } from 'src/domain/users/subscribers/language-skill-subscriber';
import { UserConnectionsController } from 'src/domain/users/user-connections.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Category,
      LanguageSkill,
      Connection,
      Abhor,
      Meetup,
      Like,
      Dislike,
      Join,
      Hate,
      Profile,
      Report,
      Secret,
      User,
    ]),
    ThrottlerModule.forRoot([
      {
        ttl: 60 * 1000,
        limit: 2,
      },
    ]),
    SesModule,
    S3Module,
    CrawlerModule,
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
