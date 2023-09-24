import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsService } from 'src/domain/inquiries/comments.service';
import { Comment } from 'src/domain/inquiries/entities/comment.entity';
import { Inquiry } from 'src/domain/inquiries/entities/inquiry.entity';
import { S3Module } from 'src/services/aws/s3.module';
import { SseModule } from 'src/services/sse/sse.module';

@Module({
  imports: [TypeOrmModule.forFeature([Inquiry, Comment]), S3Module, SseModule],
  exports: [CommentsService],
  providers: [CommentsService],
})
export class CommentsModule {}
