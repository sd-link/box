import {Injectable} from '@angular/core';
import {Observable, Subject} from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class NotifierService {
    private dataSources = new Map<string, Subject<any>>();
    private subscriptions = new Map<string, Observable<any>>();

    constructor() {
    }

    notify(eventName: string, data?: any) {
        if (!this.dataSources.has(eventName)) {
            return;
        }
        this.dataSources.get(eventName).next(data);
    }

    observable(eventName: string) {
        if (!this.dataSources.has(eventName)) {
            const subject = new Subject<any>();

            this.dataSources.set(eventName, subject);
            this.subscriptions.set(eventName, subject.asObservable());
        }

        return this.subscriptions.get(eventName);
    }
}
