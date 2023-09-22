import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnswersController } from 'src/domain/answers/answers.controller';
import { AnswersService } from 'src/domain/answers/answers.service';
import { Answer } from 'src/domain/answers/entities/answer.entity';
import { Question } from 'src/domain/questions/entities/question.entity';
import { SseModule } from 'src/services/sse/sse.module';

@Module({
  imports: [TypeOrmModule.forFeature([Answer, Question]), SseModule],
  exports: [AnswersService],
  providers: [AnswersService],
  controllers: [AnswersController],
})
export class AnswersModule {}
