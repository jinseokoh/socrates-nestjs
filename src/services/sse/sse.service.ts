import { Injectable } from '@nestjs/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { IMessageEvent } from 'src/common/interfaces';

@Injectable()
export class SseService {
  private sseMsg = new BehaviorSubject<IMessageEvent>({ data: 'test' });
  public sseMsg$: Observable<IMessageEvent> = this.sseMsg.asObservable();

  fire(msg: string) {
    this.sseMsg.next({ data: msg });
  }
}
