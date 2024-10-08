import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsService } from 'src/domain/inquiries/comments.service';
import { Comment } from 'src/domain/inquiries/entities/comment.entity';
import { Inquiry } from 'src/domain/inquiries/entities/inquiry.entity';
import { InquiriesService } from 'src/domain/inquiries/inquiries.service';
import { InquiryCommentsController } from 'src/domain/inquiries/inquiry-comments.controller';
import { InquiriesController } from 'src/domain/inquiries/inquries.controller';
import { S3Module } from 'src/services/aws/s3.module';
import { SseModule } from 'src/services/sse/sse.module';
@Module({
  imports: [TypeOrmModule.forFeature([Inquiry, Comment]), S3Module, SseModule],
  // exports: [InquiriesService],
  providers: [InquiriesService, CommentsService],
  controllers: [InquiriesController, InquiryCommentsController],
})
export class InquiriesModule {}
