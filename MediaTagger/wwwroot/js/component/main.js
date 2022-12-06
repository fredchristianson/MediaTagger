import {ComponentBase} from '../../drjs/browser/component.js';

import ViewOptionsComponent from './view-options.js';
import StatusBarComponent from './status-bar.js';
import MediaComponent from './media.js';
import SettingsComponent from './settings.js';


export class MainComponent extends ComponentBase{
    constructor(selector, htmlName='main') {
        super(selector,htmlName);
        MainComponent.instance = this;
    }

    onHtmlInserted(parent) {
        this.viewOptions = new ViewOptionsComponent("#view-options");
        this.statusBar = new StatusBarComponent("#status-bar");
       this.showSettings();
    }
    showSettings() {
        this.media = new SettingsComponent("#content-view");
      }
    
    showMedia() {
    this.media = new MediaComponent("#content-view");
    }
    
}

export default MainComponent;