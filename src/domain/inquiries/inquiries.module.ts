import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InquiryCommentsService } from 'src/domain/inquiries/inquiry-comments.service';
import { InquiryComment } from 'src/domain/inquiries/entities/inquiry_comment.entity';
import { Inquiry } from 'src/domain/inquiries/entities/inquiry.entity';
import { InquiriesService } from 'src/domain/inquiries/inquiries.service';
import { InquiryCommentsController } from 'src/domain/inquiries/inquiry-comments.controller';
import { InquiriesController } from 'src/domain/inquiries/inquries.controller';
import { S3Module } from 'src/services/aws/s3.module';
@Module({
  imports: [TypeOrmModule.forFeature([Inquiry, InquiryComment]), S3Module],
  // exports: [InquiriesService],
  providers: [InquiriesService, InquiryCommentsService],
  controllers: [InquiriesController, InquiryCommentsController],
})
export class InquiriesModule {}
