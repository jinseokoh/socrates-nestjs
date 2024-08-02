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
@Module({
  imports: [TypeOrmModule.forFeature([Question, Plea]), S3Module, FcmModule],
  providers: [QuestionsService, PleasService],
  controllers: [QuestionsController, PleasController],
})
export class IcebreakersModule {}
