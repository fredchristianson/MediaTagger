import dom from "../../drjs/browser/dom.js";
import { ComponentBase } from "../../drjs/browser/component.js";
import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import Media from "../modules/media.js";

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
export var ZoomEvent = new EventEmitter(ZoomChangeEvent, this);
var MAX_ZOOM = 800;

export class ViewOptionsComponent extends ComponentBase {
  constructor(selector, htmlName = "view-options") {
    super(selector, htmlName);
    this.listeners = [];
    this.zoomEmitter = ZoomEvent;
  }

  onHtmlInserted(parent) {
    this.listeners = new Listeners(
      // new ClickHandler(".show-settings",this,this.showSettings),
      BuildClickHandler()
        .selector(".show-settings")
        .handler(this, this.showSettings)
        .build(),
      BuildClickHandler()
        .selector(".show-media")
        .handler(this, this.showMedia)
        .build(),
      BuildClickHandler()
        .selector(".find-groups")
        .handler(this, this.findGroups)
        .build(),
      BuildInputHandler()
        .selector("[name='zoom']")
        .onChange(this, this.zoom)
        .build(),
      BuildInputHandler()
        .selector("[name='zoom-slider']")
        .onChange(this, this.zoomSlider)
        .build(),
      BuildInputHandler()
        .selector("[name='search']")
        .onChange(this, this.search)
        .debounce(500)
        .build(),
      BuildInputHandler()
        .selector("[name='sort']")
        .onChange(this, this.sort)
        .build(),
      BuildWheelHandler()
        .listenTo("#content-view")
        .withAlt(true)
        .onChange(this, this.zoomWheel)
        .build(),
      Media.getSelectedItems()
        .getUpdatedEvent()
        .createListener(this, this.selectionChange)
    );
    this.zoomInput = this.dom.first('[name="zoom"]');
    this.zoomSlider = this.dom.first('[name="zoom-slider"]');
    this.dom.setAttribute(this.zoomInput, "max", MAX_ZOOM);
    this.dom.setAttribute(this.zoomSlider, "max", MAX_ZOOM);
  }

  selectionChange(selected) {
    log.debug("selection change ", selected.getLength());
    dom.toggleClass("#content-view", "multi-select", selected.getLength() > 1);
  }
  search(text) {
    log.debug("search change ", text);
    Media.setSearchText(text);
  }

  sort(sortType) {
    log.debug("sort change ", sortType);
    Media.setSortType(sortType.toLowerCase());
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
    if (value > MAX_ZOOM) {
      value = MAX_ZOOM;
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
    main.instance.showFiles();
  }

  findGroups(target, event) {
    main.instance.findGroups();
  }
}

export default ViewOptionsComponent;
