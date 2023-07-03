import { Controller, Sse } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { Public } from 'src/common/decorators/public.decorator';
import { IMessageEvent } from 'src/common/interfaces';
import { SseService } from 'src/services/sse/sse.service';
@Controller('sse')
export class SseController {
  constructor(private readonly sseService: SseService) {}

  @EventPattern('sse.user_posted_message')
  handleSseEventUPM(data: any): void {
    this.sseService.fire('sse.user_posted_message', data);
  }

  @EventPattern('sse.user_requested_creator')
  handleSseEventURC(data: any): void {
    this.sseService.fire('sse.user_requested_creator', data);
  }

  @EventPattern('sse.creator_created_meetup')
  handleSseEventCCM(data: any): void {
    this.sseService.fire('sse.user_created_meetup', data);
  }

  @EventPattern('sse.user_joined_meetup')
  handleSseEventUJM(data: any): void {
    this.sseService.fire('sse.user_joined_meetup', data);
  }

  @EventPattern('sse.creator_accepted_user')
  handleSseEventCAU(data: any): void {
    this.sseService.fire('sse.creator_expelled_user', data);
  }

  @EventPattern('sse.creator_denied_user')
  handleSseEventCDU(data: any): void {
    this.sseService.fire('sse.creator_denied_user', data);
  }

  @EventPattern('sse.creator_expelled_user')
  handleSseEventCEU(data: any): void {
    this.sseService.fire('sse.creator_expelled_user', data);
  }

  @EventPattern('sse.creator_requested_user')
  handleSseEventCRU(data: any): void {
    this.sseService.fire('sse.creator_asked_user', data);
  }

  @Public()
  @Sse('event')
  send(): Observable<IMessageEvent> {
    return this.sseService.sseMsg$;
  }
}
