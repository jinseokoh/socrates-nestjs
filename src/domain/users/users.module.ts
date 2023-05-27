import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from 'src/domain/categories/entities/category.entity';
import { Match } from 'src/domain/meetups/entities/match.entity';
import { Like } from 'src/domain/meetups/entities/like.entity';
import { Hate } from 'src/domain/meetups/entities/hate.entity';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { Profile } from 'src/domain/users/entities/profile.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { UserFcmController } from 'src/domain/users/user-fcm.controller';
import { UserCategoriesController } from 'src/domain/users/user-categories.controller';
import { UserMeetupsController } from 'src/domain/users/user-meetups.controller';
import { UsersController } from 'src/domain/users/users.controller';
import { UsersService } from 'src/domain/users/users.service';
import { S3Module } from 'src/services/aws/s3.module';
import { CrawlerModule } from 'src/services/crawler/crawler.module';
import { FcmModule } from 'src/services/fcm/fcm.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Profile,
      Meetup,
      Category,
      Like,
      Hate,
      Match,
    ]),
    S3Module,
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
  ],
})
export class UsersModule {}
