import {ComponentBase} from '../../drjs/browser/component.js';

import ViewOptionsComponent from './view-options.js';
import TagsComponent from './tags.js';
import StatusBarComponent from './status-bar.js';
import PropertiesComponent from './properties.js';
import MediaComponent from './media.js';


export class HomeComponent extends ComponentBase{
    constructor(selector, htmlName='main') {
        super(selector,htmlName);
        this.viewOptions = new ViewOptionsComponent("#view-options");
        this.statusBar = new StatusBarComponent("#status-bar");
        this.tags = new TagsComponent("#tags");
        this.properties = new PropertiesComponent("#properties");
        this.media = new MediaComponent("#media");
    }
}

export default HomeComponent;