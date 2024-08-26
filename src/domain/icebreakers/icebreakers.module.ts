import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionsController } from 'src/domain/icebreakers/questions.controller';
import { QuestionsService } from 'src/domain/icebreakers/questions.service';
import { PleasService } from 'src/domain/icebreakers/pleas.service';
import { PleasController } from 'src/domain/icebreakers/pleas.controller';
import { Question } from 'src/domain/icebreakers/entities/question.entity';
import { Plea } from 'src/domain/icebreakers/entities/plea.entity';
import { S3Module } from 'src/services/aws/s3.module';
import { FcmModule } from 'src/services/fcm/fcm.module';
import { Icebreaker } from 'src/domain/icebreakers/entities/icebreaker.entity';
import { IcebreakersService } from 'src/domain/icebreakers/icebreakers.service';
import { IcebreakersController } from 'src/domain/icebreakers/icebreakers.controller';
import { IcebreakerAnswerUsersService } from 'src/domain/icebreakers/icebreaker_answer-users.service';
import { IcebreakerAnswerUsersController } from 'src/domain/icebreakers/icebreaker_answer-users.controller';
import { IcebreakerAnswer } from 'src/domain/icebreakers/entities/icebreaker_answer.entity';
import { IcebreakerUsersService } from 'src/domain/icebreakers/icebreaker-users.service';
import { IcebreakerUsersController } from 'src/domain/icebreakers/icebreaker-users.controller';
import { User } from 'src/domain/users/entities/user.entity';
import { Flag } from 'src/domain/users/entities/flag.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Icebreaker,
      IcebreakerAnswer,
      Question,
      User,
      Flag,
      Plea,
    ]),
    S3Module,
    FcmModule,
  ],
  providers: [
    IcebreakersService,
    IcebreakerUsersService,
    IcebreakerAnswerUsersService,
    QuestionsService,
    PleasService,
  ],
  controllers: [
    IcebreakersController,
    IcebreakerUsersController,
    IcebreakerAnswerUsersController,
    QuestionsController,
    PleasController,
  ],
})
export class IcebreakersModule {}
