import { Observable, Subject } from 'rxjs';
import { IMessageEvent } from 'src/common/interfaces';

// ref) https://stackoverflow.com/questions/67202527/can-we-use-server-sent-events-in-nestjs-without-using-interval
// {
//   data: 'hello', // payload
//   type: 'ping', // event name
// });
export class SseService {
  //? not fully tested, but the theory is as follows:
  //? - Subject is required to broadcast message out to all the clients
  //? - A list of Subjects and Observables are required to selectively send/receive data
  public static subjectz: Subject<IMessageEvent>[] = [];
  public streamz$: Observable<IMessageEvent>[] = [];

  for(channel: number) {
    if (!SseService.subjectz[channel]) {
      SseService.subjectz[channel] = new Subject<IMessageEvent>();
      this.streamz$[channel] = SseService.subjectz[channel].asObservable();
    }
    return this;
  }

  fire(channel: number, type: string, data: object) {
    SseService.subjectz[channel].next({ type, data });
  }
}
