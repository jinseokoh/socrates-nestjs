import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from 'src/domain/questions/entities/question.entity';
import { QuestionsController } from 'src/domain/questions/questions.controller';
import { QuestionsService } from 'src/domain/questions/questions.service';
import { S3Module } from 'src/services/aws/s3.module';
@Module({
  imports: [TypeOrmModule.forFeature([Question]), S3Module],
  exports: [QuestionsService],
  providers: [QuestionsService],
  controllers: [QuestionsController],
})
export class QuestionsModule {}
