import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Survey } from 'src/domain/surveys/survey.entity';
import { SurveysController } from 'src/domain/surveys/surveys.controller';
import { SurveysService } from 'src/domain/surveys/surveys.service';
import { User } from 'src/domain/users/user.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Survey, User])],
  exports: [SurveysService],
  providers: [SurveysService],
  controllers: [SurveysController],
})
export class SurveysModule {}
