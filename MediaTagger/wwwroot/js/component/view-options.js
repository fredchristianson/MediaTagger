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
  BuildCheckboxHandler,
  EventEmitter,
  ObjectEventType,
} from "../../drjs/browser/event.js";
import { Settings } from "../modules/settings.js";

export var ZoomChangeEventType = new ObjectEventType("zoomChange");
export var ZoomEvent = new EventEmitter(ZoomChangeEventType, this);
export var ExpandGroupsEventType = new ObjectEventType("ExpandGroups");
export var ExpandGroupsEvent = new EventEmitter(ExpandGroupsEventType, this);
var MAX_ZOOM = 800;
const DEFAULT_SETTINGS = {
  zoom: 100,
  showSecondary: false,
  sort: "Name",
};

export class ViewOptionsComponent extends ComponentBase {
  constructor(selector, htmlName = "view-options") {
    super(selector, htmlName);
    this.listeners = [];
    this.zoomEmitter = ZoomEvent;
  }

  async onHtmlInserted(parent) {
    this.settings = await Settings.load("view", DEFAULT_SETTINGS);
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
        .onInput(this, this.zoom)
        .build(),
      BuildInputHandler()
        .selector("[name='zoom-slider']")
        .onInput(this, this.zoomSlider)
        .build(),
      BuildInputHandler()
        .selector("[name='search']")
        .onInput(this, this.search)
        .debounce(500)
        .build(),
      BuildCheckboxHandler()
        .selector("[name='expand-groups']")
        .onInput(this, this.expandGroupsChange)
        .build(),

      BuildInputHandler()
        .selector("[name='sort']")
        .onInput(this, this.sort)
        .build(),
      BuildWheelHandler()
        .listenTo("#content-view")
        .withAlt(true)
        .onChange(this, this.zoomWheel)
        .build(),
      Media.getSelectedItems()
        .getUpdatedEvent()
        .createListener(this, this.selectionInput)
    );
    this.zoomInput = this.dom.first('[name="zoom"]');
    this.zoomSlider = this.dom.first('[name="zoom-slider"]');
    this.dom.setAttribute(this.zoomInput, "max", MAX_ZOOM);
    this.dom.setAttribute(this.zoomSlider, "max", MAX_ZOOM);
    await this.setZoom(this.settings.get("zoom", 100));

    await this.setSort(this.settings.get("sort", "Date"));
    await this.setExpandGroups(this.settings.get("showSecondary", false));
  }

  async expandGroupsChange(checked) {
    log.debug("expand groups", checked);
    await this.setExpandGroups(checked);
  }

  async setExpandGroups(expand) {
    this.dom.check("[name='expand-groups']", expand);
    ExpandGroupsEvent.emit(expand);
    Media.showSecondaryGroupFiles(expand);
    await this.settings.set("showSecondary", expand);
  }
  selectionInput(selected) {
    log.debug("selection change ", selected.getLength());
    dom.toggleClass("#content-view", "multi-select", selected.getLength() > 1);
  }
  search(text) {
    log.debug("search change ", text);
    Media.setSearchText(text);
  }

  async sort(sortType) {
    log.debug("sort change ", sortType);
    await this.setSort(sortType);
  }

  async setSort(sortType) {
    this.dom.setValue("[name='sort']", sortType);
    Media.setSortType(sortType.toLowerCase());
    await this.settings.set("sort", sortType);
  }
  onDetach() {
    this.listeners.remove();
  }

  async zoomWheel(delta) {
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
    await this.setZoom(value);
  }

  async setZoom(value) {
    this.dom.setValue(this.zoomSlider, value);
    this.dom.setValue(this.zoomInput, value);
    await this.settings.set("zoom", value);

    this.zoomEmitter.emit(value);
  }

  async zoom(value) {
    log.debug("zoom input change ", value);
    await this.setZoom(value);
  }
  async zoomSlider(value) {
    log.debug("zoom slider change ", value);
    await this.setZoom(value);
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
