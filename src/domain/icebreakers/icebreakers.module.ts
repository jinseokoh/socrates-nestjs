import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionsController } from 'src/domain/icebreakers/questions.controller';
import { QuestionsService } from 'src/domain/icebreakers/questions.service';
import { Question } from 'src/domain/icebreakers/entities/question.entity';
import { S3Module } from 'src/services/aws/s3.module';
import { FcmModule } from 'src/services/fcm/fcm.module';
@Module({
  imports: [TypeOrmModule.forFeature([Question]), S3Module, FcmModule],
  providers: [QuestionsService],
  controllers: [QuestionsController],
})
export class IcebreakersModule {}
