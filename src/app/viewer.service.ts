import {Injectable} from '@angular/core';
import {BabylonViewerComponent} from './babylon-viewer/babylon-viewer.component';
import {Observable, Subject} from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ViewerService {
    public viewer: BabylonViewerComponent;

    private initializedSource = new Subject<boolean>();
    public initialized: Observable<boolean> = this.initializedSource.asObservable();
    private meshClickedSource = new Subject<string>();
    public meshClicked: Observable<string> = this.meshClickedSource.asObservable();
    private resetSource = new Subject<any>();
    public reset: Observable<any> = this.resetSource.asObservable();

    constructor() {
    }

    notifyClick(meshName: string) {
        this.meshClickedSource.next(meshName);
    }

    notifyInitialized() {
        this.initializedSource.next(true);
    }

    notifyReset() {
        this.resetSource.next();
    }
}
