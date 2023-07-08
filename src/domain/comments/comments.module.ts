import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsController } from 'src/domain/comments/comments.controller';
import { CommentsService } from 'src/domain/comments/comments.service';
import { Comment } from 'src/domain/comments/entities/comment.entity';
import { Question } from 'src/domain/questions/entities/question.entity';
import { SseModule } from 'src/services/sse/sse.module';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Question]), SseModule],
  exports: [CommentsService],
  providers: [CommentsService],
  controllers: [CommentsController],
})
export class CommentsModule {}
