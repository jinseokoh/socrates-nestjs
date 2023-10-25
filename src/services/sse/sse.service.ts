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
  //? 1. Subject is required to broadcast messages out to all the participants
  //? 2. A list of Subjects and Observables are required to selectively send/receive data
  //?
  public static subjectz: Subject<IMessageEvent>[] = [];
  public streamz$: Observable<IMessageEvent>[] = [];

  for(channel: number) {
    if (!SseService.subjectz[channel]) {
      SseService.subjectz[channel] = new Subject<IMessageEvent>();
      this.streamz$[channel] = SseService.subjectz[channel].asObservable();
    }
    return this;
  }

  // additional ref) https://ncjamieson.com/closed-subjects/
  close(channel: number) {
    SseService.subjectz[channel] = null;
    this.streamz$[channel] = null;
  }

  fire(channel: number, type: string, data: object) {
    SseService.subjectz[channel].next({ type, data });
  }
}
