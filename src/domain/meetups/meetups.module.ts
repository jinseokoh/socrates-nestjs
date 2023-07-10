import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Career } from 'src/domain/careers/entities/career.entity';
import { Category } from 'src/domain/categories/entities/category.entity';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { MeetupCommentsController } from 'src/domain/meetups/meetup-comments.controller';
import { MeetupUsersController } from 'src/domain/meetups/meetup-users.controller';
import { MeetupsController } from 'src/domain/meetups/meetups.controller';
import { MeetupsService } from 'src/domain/meetups/meetups.service';
import { User } from 'src/domain/users/entities/user.entity';
import { Venue } from 'src/domain/venues/entities/venue.entity';
import { S3Module } from 'src/services/aws/s3.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Meetup, Venue, User, Category, Career]),
    S3Module,
  ],
  exports: [MeetupsService], // we need this for what?
  providers: [MeetupsService],
  controllers: [
    MeetupsController,
    MeetupUsersController,
    MeetupCommentsController,
  ],
})
export class MeetupsModule {}
