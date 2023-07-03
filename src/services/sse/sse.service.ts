import { Observable, Subject } from 'rxjs';
import { IMessageEvent } from 'src/common/interfaces';

// ref) https://stackoverflow.com/questions/67202527/can-we-use-server-sent-events-in-nestjs-without-using-interval
export class SseService {
  private sseMsg = new Subject<IMessageEvent>();
  // {
  //   data: 'hello', // payload
  //   type: 'ping', // event name
  // });
  public sseMsg$: Observable<IMessageEvent> = this.sseMsg.asObservable();

  fire(type: string, data: object) {
    this.sseMsg.next({ data, type });
  }
}
