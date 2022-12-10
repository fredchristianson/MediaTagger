import dom from "../../drjs/browser/dom.js";
import { ComponentBase } from "../../drjs/browser/component.js";
import { LOG_LEVEL, Logger } from "../../drjs/logger.js";

import main from "./main.js";
const log = Logger.create("ViewOptions", LOG_LEVEL.DEBUG);

import {
  Listeners,
  BuildClickHandler,
  BuildInputHandler,
  BuildWheelHandler,
  EventEmitter,
  ObjectEventType,
} from "../../drjs/browser/event.js";

export var ZoomChangeEvent = new ObjectEventType("zoomChange");

export class ViewOptionsComponent extends ComponentBase {
  constructor(selector, htmlName = "view-options") {
    super(selector, htmlName);
    this.listeners = [];
    this.zoomEmitter = new EventEmitter(ZoomChangeEvent, this);
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
        .build(),
      BuildInputHandler()
        .selector("[name='zoom-slider']")
        .onChange(this, this.zoomSlider)
        .build(),
      BuildWheelHandler()
        .listenTo("#content-view")
        .withAlt(true)
        .onChange(this, this.zoomWheel)
        .build()
    );
    //        this.listen("click",".show-settings",this.showSettings);
    //        this.listen("click",".show-media",this.showMedia);
  }

  onDetach() {
    this.listeners.remove();
  }

  zoomWheel(delta) {
    log.debug("zoom wheel change ", delta);
    var value = dom.getValue('[name="zoom-slider"]');
    if (delta > 0) {
      value = value * 1.1;
    } else {
      value = value * 0.9;
    }

    if (value < 25) {
      value = 25;
    }
    if (value > 300) {
      value = 300;
    }
    value = Math.floor(value);
    dom.setValue('[name="zoom-slider"]', value);
    dom.setValue('[name="zoom"]', value);
    this.zoomEmitter.emit(value);
  }

  zoom(value) {
    log.debug("zoom input change ", value);
    dom.setValue('[name="zoom-slider"]', value);
    this.zoomEmitter.emit(value);
  }
  zoomSlider(value) {
    log.debug("zoom slider change ", value);
    dom.setValue('[name="zoom"]', value);
    this.zoomEmitter.emit(value);
  }
  showSettings(target, event) {
    main.instance.showSettings();
  }

  showMedia(target, event) {
    main.instance.showMedia();
  }
}

export default ViewOptionsComponent;
