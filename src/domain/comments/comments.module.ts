import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsController } from 'src/domain/comments/comments.controller';
import { CommentsService } from 'src/domain/comments/comments.service';
import { Comment } from 'src/domain/comments/entities/comment.entity';
import { Inquiry } from 'src/domain/inquiries/entities/inquiry.entity';
import { SseModule } from 'src/services/sse/sse.module';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Inquiry]), SseModule],
  exports: [CommentsService],
  providers: [CommentsService],
  controllers: [CommentsController],
})
export class CommentsModule {}
