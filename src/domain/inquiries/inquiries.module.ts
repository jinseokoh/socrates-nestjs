import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inquiry } from 'src/domain/inquiries/entities/inquiry.entity';
import { InquiryComment } from 'src/domain/inquiries/entities/inquiry_comment.entity';
import { S3Module } from 'src/services/aws/s3.module';
import { InquiriesService } from 'src/domain/inquiries/inquiries.service';
import { InquiryCommentUsersService } from 'src/domain/inquiries/inquiry_comment-users.service';
import { InquiriesController } from 'src/domain/inquiries/inquries.controller';
import { InquiryCommentUsersController } from 'src/domain/inquiries/inquiry_comment-users.controller';
@Module({
  imports: [TypeOrmModule.forFeature([Inquiry, InquiryComment]), S3Module],
  // exports: [InquiriesService],
  providers: [InquiriesService, InquiryCommentUsersService],
  controllers: [InquiriesController, InquiryCommentUsersController],
})
export class InquiriesModule {}
