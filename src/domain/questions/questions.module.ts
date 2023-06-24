import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from 'src/domain/questions/entities/question.entity';
import { QuestionCommentsController } from 'src/domain/questions/question-comments.controller';
import { QuestionsController } from 'src/domain/questions/questions.controller';
import { QuestionsService } from 'src/domain/questions/questions.service';
@Module({
  imports: [TypeOrmModule.forFeature([Question])],
  exports: [QuestionsService],
  providers: [QuestionsService],
  controllers: [QuestionsController, QuestionCommentsController],
})
export class QuestionsModule {}
