import { Module } from '@nestjs/common';
import { SseService } from 'src/services/sse/sse.service';

@Module({
  exports: [SseService],
  providers: [SseService],
})
export class SseModule {}
