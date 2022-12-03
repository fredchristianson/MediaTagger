import {ComponentBase} from '../../drjs/browser/component.js';
import {Selector,default as DOMEvent} from '../../drjs/browser/dom-event.js';
import env from '../../drjs/env.js';
import main from './main.js';

export class ViewOptionsComponent extends ComponentBase{
    constructor(selector, htmlName='view-options') {
        super(selector,htmlName);
    }

    onHtmlInserted(parent) {
        this.listen("click",".show-settings",this.showSettings);
        this.listen("click",".show-media",this.showMedia);
    }

    showSettings() {
        main.instance.showSettings();
    }

    showMedia() {
        main.instance.showMedia();
    }
}

export default ViewOptionsComponent;