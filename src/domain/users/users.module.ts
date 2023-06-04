import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from 'src/domain/categories/entities/category.entity';
import { Match } from 'src/domain/meetups/entities/match.entity';
import { Like } from 'src/domain/meetups/entities/like.entity';
import { Hate } from 'src/domain/meetups/entities/hate.entity';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { Profile } from 'src/domain/users/entities/profile.entity';
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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Secret,
      Profile,
      Meetup,
      Match,
      Like,
      Hate,
      Category,
    ]),
    S3Module,
    SesModule,
    CrawlerModule,
    FcmModule,
  ],
  exports: [UsersService],
  providers: [UsersService],
  controllers: [
    UsersController,
    UserCategoriesController,
    UserMeetupsController,
    UserFcmController,
    UserSmsController,
  ],
})
export class UsersModule {}
