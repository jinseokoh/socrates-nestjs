import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnswersController } from 'src/domain/icebreakers/answers.controller';
import { AnswersService } from 'src/domain/icebreakers/answers.service';
import { QuestionsController } from 'src/domain/icebreakers/questions.controller';
import { QuestionsService } from 'src/domain/icebreakers/questions.service';
import { Question } from 'src/domain/icebreakers/entities/question.entity';
import { AnswerComment } from 'src/domain/icebreakers/entities/answer_comment.entity';
import { Answer } from 'src/domain/icebreakers/entities/answer.entity';
import { S3Module } from 'src/services/aws/s3.module';
import { FcmModule } from 'src/services/fcm/fcm.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Question, Answer, AnswerComment]),
    S3Module,
    FcmModule,
  ],
  providers: [
    QuestionsService,
    AnswersService,
    // AnswerCommentsService,
    // AnswerSubscriber,
  ],
  controllers: [
    QuestionsController,
    AnswersController,
    // AnswerCommentsController,
  ],
})
export class QuestionsModule {}
