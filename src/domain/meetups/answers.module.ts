import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from 'src/domain/meetups/entities/question.entity';
import { Answer } from 'src/domain/meetups/entities/answer.entity';
import { AnswersService } from 'src/domain/meetups/answers.service';
import { SseModule } from 'src/services/sse/sse.module';

@Module({
  imports: [TypeOrmModule.forFeature([Question, Answer]), SseModule],
  exports: [AnswersService],
  providers: [AnswersService],
})
export class AnswersModule {}
