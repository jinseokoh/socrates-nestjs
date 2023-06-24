import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsController } from 'src/domain/comments/comments.controller';
import { CommentsService } from 'src/domain/comments/comments.service';
import { Question } from 'src/domain/questions/entities/question.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Comment, Question])],
  providers: [CommentsService],
  controllers: [CommentsController],
})
export class CommentsModule {}
