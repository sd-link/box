import {Component} from '@angular/core';
import { InteractionEventService } from '../interaction-event.service';
import { ViewerBindingService } from '../viewer-binding.service';
import { SimpleModelTracking } from '../babylon-viewer/babylon-viewer.component';
import {HelperTextService} from '../helper-text.service';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.css']
})
export class NavBarComponent {
  public submitURL = '';
  public chosenLanguage = 'en';
  public languages = ['en', 'de'];

  constructor(private interactionEventService: InteractionEventService, private viewerBindingService: ViewerBindingService,
              public helperTextService: HelperTextService, public translate: TranslateService) {
    this.submitURL = window['modularStorageSubmitURL'];
    
    // the lang to use, if the lang isn't available, it will use the current loader to get them
    // look up the "lang" url parameter and choose the language based on that
    let search = window.location.search;
    let langIndex = search.indexOf("lang=");
    let lang = (langIndex >= 0) ? search.substr(langIndex + 5, 2) : 'en';
    this.chosenLanguage = lang;
    this.languageChosen();
  }

  activeModels(): SimpleModelTracking[] {
    return this.viewerBindingService.viewer.placedModels() || [];
  }

  currentProductImage(): string {
    return this.viewerBindingService.viewer.currentProductImageBase64;
  }

  onSubmit(e) {
    e.target.submit();
  }

  reset() {
    this.interactionEventService.notify('reset');
  }
  
  languageChosen() {
    this.translate.use(this.chosenLanguage);
  }
}
