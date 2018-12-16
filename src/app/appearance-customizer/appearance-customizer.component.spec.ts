import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppearanceCustomizerComponent } from './appearance-customizer.component';

describe('AppearanceCustomizerComponent', () => {
  let component: AppearanceCustomizerComponent;
  let fixture: ComponentFixture<AppearanceCustomizerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AppearanceCustomizerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppearanceCustomizerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
