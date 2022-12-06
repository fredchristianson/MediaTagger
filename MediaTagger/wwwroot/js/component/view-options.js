import {ComponentBase} from '../../drjs/browser/component.js';
import main from './main.js';
import {Listeners, BuildClickHandler} from "../../drjs/browser/event.js";

export class ViewOptionsComponent extends ComponentBase{
    constructor(selector, htmlName='view-options') {
        super(selector,htmlName);
        this.listeners = [];
    }

    onHtmlInserted(parent) {
        this.listeners = new Listeners(
           // new ClickHandler(".show-settings",this,this.showSettings),
           BuildClickHandler()
                .selector(".show-settings")
                .setHandler(this,this.showSettings)
                .build(),
            BuildClickHandler()
            .selector(".show-media")
            .setHandler(this,this.showMedia)
            .build()
        );
//        this.listen("click",".show-settings",this.showSettings);
//        this.listen("click",".show-media",this.showMedia);

    }

    onDetach() {
        this.listeners.remove();
    }

    showSettings(target,event) {
        main.instance.showSettings();
    }

    showMedia(target,event) {
        main.instance.showMedia();
    }
}

export default ViewOptionsComponent;