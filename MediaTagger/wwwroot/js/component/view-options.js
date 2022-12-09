import { ComponentBase } from "../../drjs/browser/component.js";
import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import styles from "../modules/style.js";

import main from "./main.js";
const log = Logger.create("ViewOptions", LOG_LEVEL.DEBUG);

import {
  Listeners,
  BuildClickHandler,
  BuildInputHandler,
} from "../../drjs/browser/event.js";

export class ViewOptionsComponent extends ComponentBase {
  constructor(selector, htmlName = "view-options") {
    super(selector, htmlName);
    this.listeners = [];
  }

  onHtmlInserted(parent) {
    this.listeners = new Listeners(
      // new ClickHandler(".show-settings",this,this.showSettings),
      BuildClickHandler()
        .selector(".show-settings")
        .setHandler(this, this.showSettings)
        .build(),
      BuildClickHandler()
        .selector(".show-media")
        .setHandler(this, this.showMedia)
        .build(),
      BuildInputHandler()
        .selector("[name='zoom']")
        .onChange(this, this.zoom)
        .build()
    );
    //        this.listen("click",".show-settings",this.showSettings);
    //        this.listen("click",".show-media",this.showMedia);
  }

  onDetach() {
    this.listeners.remove();
  }

  zoom(value) {
    styles.updateMediaZoom(value);
  }
  showSettings(target, event) {
    main.instance.showSettings();
  }

  showMedia(target, event) {
    main.instance.showMedia();
  }
}

export default ViewOptionsComponent;
