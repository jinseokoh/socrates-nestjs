import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Career } from 'src/domain/careers/entities/career.entity';
import { Category } from 'src/domain/categories/entities/category.entity';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { Question } from 'src/domain/meetups/entities/question.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Venue } from 'src/domain/venues/entities/venue.entity';
import { MeetupQuestionsController } from 'src/domain/meetups/meetup-questions.controller';
import { MeetupUsersController } from 'src/domain/meetups/meetup-users.controller';
import { MeetupsController } from 'src/domain/meetups/meetups.controller';
import { MeetupsService } from 'src/domain/meetups/meetups.service';
import { AnswersService } from 'src/domain/meetups/answers.service';
import { QuestionsService } from 'src/domain/meetups/questions.service';
import { Answer } from 'src/domain/meetups/entities/answer.entity';
import { MeetupAnswersController } from 'src/domain/meetups/meetup-answers.controller';
import { S3Module } from 'src/services/aws/s3.module';
import { SseModule } from 'src/services/sse/sse.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Meetup,
      Venue,
      Category,
      Career,
      User,
      Question,
      Answer,
    ]),
    S3Module,
    SseModule,
  ],
  // exports: [MeetupsService], // we need this for what?
  providers: [MeetupsService, QuestionsService, AnswersService],
  controllers: [
    MeetupsController,
    MeetupUsersController,
    MeetupQuestionsController,
    MeetupAnswersController,
  ],
})
export class MeetupsModule {}
