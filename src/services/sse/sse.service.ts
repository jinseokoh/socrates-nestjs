import { Observable, Subject } from 'rxjs';
import { IMessageEvent } from 'src/common/interfaces';

// ref) https://stackoverflow.com/questions/67202527/can-we-use-server-sent-events-in-nestjs-without-using-interval
// {
//   type: 'ping', // event name
//   data: 'hello', // payload
// });
export class SseService {
  //? not fully tested, but the theory is as follows:
  //?
  //? Subject is required to broadcast messages out to all the participants
  //?
  private subject = new Subject<IMessageEvent>();
  public sseStream$: Observable<IMessageEvent> = this.subject.asObservable();

  fire(type: string, data: object) {
    this.subject.next({ type, data });
  }
}
