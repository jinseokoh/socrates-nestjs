import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpinionsService } from 'src/domain/inquiries/opinions.service';
import { Opinion } from 'src/domain/inquiries/entities/opinion.entity';
import { Inquiry } from 'src/domain/inquiries/entities/inquiry.entity';
import { InquiriesService } from 'src/domain/inquiries/inquiries.service';
import { InquiryOpinionsController } from 'src/domain/inquiries/inquiry-opinions.controller';
import { InquiriesController } from 'src/domain/inquiries/inquries.controller';
import { S3Module } from 'src/services/aws/s3.module';
import { SseModule } from 'src/services/sse/sse.module';
@Module({
  imports: [TypeOrmModule.forFeature([Inquiry, Opinion]), S3Module, SseModule],
  // exports: [InquiriesService],
  providers: [InquiriesService, OpinionsService],
  controllers: [InquiriesController, InquiryOpinionsController],
})
export class InquiriesModule {}
