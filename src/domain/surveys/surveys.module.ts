import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlackModule } from 'nestjs-slack-webhook';
import { Hashtag } from 'src/domain/hashtags/hashtag.entity';
import { QuestionsModule } from 'src/domain/questions/questions.module';
import { Survey } from 'src/domain/Surveys/Survey.entity';
import { SurveysController } from 'src/domain/Surveys/Surveys.controller';
import { SurveysService } from 'src/domain/Surveys/Surveys.service';
import { UsersModule } from 'src/domain/users/users.module';
import { S3Module } from 'src/services/aws/s3.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Survey, Hashtag]),
    UsersModule,
    QuestionsModule,
    SlackModule,
    S3Module,
  ],
  exports: [SurveysService],
  providers: [SurveysService],
  controllers: [SurveysController],
})
export class SurveysModule {}
