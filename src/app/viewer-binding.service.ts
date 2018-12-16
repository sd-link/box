import { Injectable } from '@angular/core';
import {BabylonViewerComponent} from './babylon-viewer/babylon-viewer.component';
import {Observable, Subject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ViewerBindingService {
  public viewer: BabylonViewerComponent = null;

  private initializedSource = new Subject<boolean>();
  private modelSelectionChangedSource = new Subject<any>();

  public initialized: Observable<boolean> = this.initializedSource.asObservable();
  public modelSelectionChanged: Observable<any> = this.modelSelectionChangedSource.asObservable();

  constructor() { }

  notifyInitialized() {
    this.initializedSource.next(true);
  }

  notifySelectionChanged(data: any) {
    this.modelSelectionChangedSource.next(data);
  }

  setViewer(viewer: BabylonViewerComponent) {
    this.viewer = viewer;
  }
}
