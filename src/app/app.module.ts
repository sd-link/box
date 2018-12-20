import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {HttpClientModule} from '@angular/common/http';
import {ModalModule} from 'ngx-bootstrap/modal';
import {InlineSVGModule} from 'ng-inline-svg';

import {AppComponent} from './app.component';
import {BabylonViewerComponent} from './babylon-viewer/babylon-viewer.component';
import {NavBarComponent} from './nav-bar/nav-bar.component';
import {AppearanceControlsComponent} from './appearance-controls/appearance-controls.component';
import {ShareModalComponent} from './share-modal/share-modal.component';
import {LoginModalComponent} from './login-modal/login-modal.component';
import { DragScrollModule } from 'ngx-drag-scroll';

@NgModule({
    declarations: [
        AppComponent,
        BabylonViewerComponent,
        NavBarComponent,
        AppearanceControlsComponent,
        ShareModalComponent,
        LoginModalComponent,
        
    ],
    imports: [
        BrowserModule,
        HttpClientModule,
        ModalModule.forRoot(),
        InlineSVGModule.forRoot(),
        DragScrollModule
    ],
    providers: [],
    entryComponents: [LoginModalComponent, ShareModalComponent],
    bootstrap: [AppComponent]
})
export class AppModule {
}
