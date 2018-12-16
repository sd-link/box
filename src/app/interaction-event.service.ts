import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

class Emitter {
  subject: Subject<any> = new Subject<any>();
  observable: Observable<any> = this.subject.asObservable();
}

@Injectable({
  providedIn: 'root'
})
export class InteractionEventService {
  private handlers = new Map<string, Emitter>();

  notify(eventName: string, data?: any) {
    this.getEmitter(eventName).subject.next(data);
  }

  observable(eventName: string) {
    return this.getEmitter(eventName).observable;
  }

  private getEmitter(eventName: string) {
    if (!this.handlers.has(eventName)) {
      const emitter = new Emitter();

      this.handlers.set(eventName, emitter);

      return emitter;
    }

    return this.handlers.get(eventName);
  }
}
