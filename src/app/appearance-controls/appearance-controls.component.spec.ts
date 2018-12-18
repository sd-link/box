import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {AppearanceControlsComponent} from './appearance-controls.component';

describe('AppearanceControlsComponent', () => {
    let component: AppearanceControlsComponent;
    let fixture: ComponentFixture<AppearanceControlsComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [AppearanceControlsComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AppearanceControlsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
