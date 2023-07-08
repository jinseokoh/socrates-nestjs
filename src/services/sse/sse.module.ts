import { Module } from '@nestjs/common';
import { SseController } from 'src/services/sse/sse.controller';
import { SseService } from 'src/services/sse/sse.service';

@Module({
  exports: [SseService],
  providers: [SseService],
  // controllers: [SseController],
})
export class SseModule {}
