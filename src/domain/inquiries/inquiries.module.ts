import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inquiry } from 'src/domain/inquiries/entities/inquiry.entity';
import { InquiriesService } from 'src/domain/inquiries/inquiries.service';
import { InquiriesController } from 'src/domain/inquiries/inquries.controller';
import { S3Module } from 'src/services/aws/s3.module';
@Module({
  imports: [TypeOrmModule.forFeature([Inquiry]), S3Module],
  exports: [InquiriesService],
  providers: [InquiriesService],
  controllers: [InquiriesController],
})
export class InquiriesModule {}
