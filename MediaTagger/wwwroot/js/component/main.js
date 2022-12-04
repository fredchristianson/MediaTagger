import {ComponentBase} from '../../drjs/browser/component.js';

import ViewOptionsComponent from './view-options.js';
import TagsComponent from './tags.js';
import StatusBarComponent from './status-bar.js';
import PropertiesComponent from './properties.js';
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
        this.tags = new TagsComponent("#tags");
        this.properties = new PropertiesComponent("#properties");
       // this.media = new MediaComponent("#media");
       this.showSettings();
    }
    showSettings() {
        this.media = new SettingsComponent("#media");
      }
    
    showMedia() {
    this.media = new MediaComponent("#media");
    }
    
}

export default MainComponent;