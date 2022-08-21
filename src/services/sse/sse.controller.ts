import { Controller, Sse } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { Public } from 'src/common/decorators/public.decorator';
import { SseService } from 'src/services/sse/sse.service';
@Controller('sse')
export class SseController {
  constructor(private readonly sseService: SseService) {}

  @EventPattern('RealTime')
  handleRealTimeEvent(data: any): any {
    console.log(data, '<~ redis pubsub subscriber');
    return this.sseService.fire(data);
  }

  @Public()
  @Sse('event')
  send(data: any): Observable<any> {
    console.log(data, 'realtime server sent event');
    return this.sseService.sseMsg$;
  }
}
