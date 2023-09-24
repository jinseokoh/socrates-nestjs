import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from 'src/domain/meetups/entities/question.entity';
import { Answer } from 'src/domain/meetups/entities/answer.entity';
import { QuestionsService } from 'src/domain/meetups/questions.service';
import { S3Module } from 'src/services/aws/s3.module';

@Module({
  imports: [TypeOrmModule.forFeature([Question, Answer]), S3Module],
  exports: [QuestionsService],
  providers: [QuestionsService],
})
export class QuestionsModule {}
