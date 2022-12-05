import {ComponentBase} from '../../drjs/browser/component.js';
import main from './main.js';
import {Listeners,ClickHandler} from "../../drjs/browser/event.js";

export class ViewOptionsComponent extends ComponentBase{
    constructor(selector, htmlName='view-options') {
        super(selector,htmlName);
        this.listeners = [];
    }

    onHtmlInserted(parent) {
        this.listeners = new Listeners(
            new ClickHandler(".show-settings",this,this.showSettings),
            new ClickHandler(".show-media",this,this.showMedia)
        );
//        this.listen("click",".show-settings",this.showSettings);
//        this.listen("click",".show-media",this.showMedia);

    }

    onDetach() {
        this.listeners.remove();
    }

    showSettings(target,event) {
        main.instance.showSettings();
        event.stopPropagation();
    }

    showMedia(target,event) {
        main.instance.showMedia();
        event.stopPropagation();
    }
}

export default ViewOptionsComponent;