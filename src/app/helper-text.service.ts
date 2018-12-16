import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HelperTextService {
  private helperTextSource = new Subject<string>();

  helperTextObservable = this.helperTextSource.asObservable();

  clearText() {
    this.helperTextSource.next('');
  }

  setText(value: string) {
    this.helperTextSource.next(value);
  }
}
