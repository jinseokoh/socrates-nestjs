import { Observable, Subject } from 'rxjs';
import { IMessageEvent } from 'src/common/interfaces';

// ref) https://stackoverflow.com/questions/67202527/can-we-use-server-sent-events-in-nestjs-without-using-interval
// {
//   data: 'hello', // payload
//   type: 'ping', // event name
// });
export class SseService {
  //? Subject is required to broadcast message out to all the clients
  private subject = new Subject<IMessageEvent>();
  public sseStream$: Observable<IMessageEvent> = this.subject.asObservable();

  fire(type: string, data: object) {
    this.subject.next({ data, type });
  }
}
