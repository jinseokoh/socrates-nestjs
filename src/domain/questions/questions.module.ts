import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from 'src/domain/questions/entities/question.entity';
import { QuestionsController } from 'src/domain/questions/questions.controller';
import { QuestionsService } from 'src/domain/questions/questions.service';
@Module({
  imports: [TypeOrmModule.forFeature([Question])],
  exports: [QuestionsService],
  providers: [QuestionsService],
  controllers: [QuestionsController],
})
export class QuestionsModule {}
