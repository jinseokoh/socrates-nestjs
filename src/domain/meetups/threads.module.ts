import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Thread } from 'src/domain/meetups/entities/thread.entity';
import { ThreadsService } from 'src/domain/meetups/threads.service';
import { S3Module } from 'src/services/aws/s3.module';
import { SseModule } from 'src/services/sse/sse.module';

// todo. no longer required. delete this soon
@Module({
  imports: [TypeOrmModule.forFeature([Thread]), S3Module, SseModule],
  exports: [ThreadsService],
  providers: [ThreadsService],
})
export class ThreadsModule {}
