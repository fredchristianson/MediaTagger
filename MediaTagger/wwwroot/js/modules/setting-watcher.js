import { Settings } from "./settings.js";
import { default as DOM } from "../../drjs/browser/dom.js";
import {
  StyleChangeAction,
  ClassChangeAction,
  NewElementWatcher,
  DOMWatcher,
} from "./dom-watcher.js";
import { LOG_LEVEL, Logger } from "../../drjs/logger.js";

const log = Logger.create("SettingWatcher", LOG_LEVEL.DEBUG);

class SettingWatcher {
  constructor() {
    this.settings = null;
  }

  async init() {
    if (this.settings == null) {
      this.settings = await Settings.load("dom-settings");
    }
    this.domWatcher = new DOMWatcher();
    this.classWatcher = new ClassChangeAction(
      ".has-setting",
      this.classChange.bind(this)
    );
    this.styleWatcher = new StyleChangeAction(
      ".has-setting",
      this.styleChange.bind(this)
    );
    this.newElementWatcher = new NewElementWatcher(
      ".has-setting",
      this.newElement.bind(this)
    );
    this.domWatcher.addAction(this.classWatcher);
    this.domWatcher.addAction(this.styleWatcher);
    this.domWatcher.addAction(this.newElementWatcher);
    var elements = DOM.find(".has-setting");
    elements.forEach((e) => {
      this.updateSettings(e);
    });
  }

  classChange(element, oldValue, newValue) {
    log.debug("class change");
    const classSettingName = DOM.getData(element, "class-setting-name");
    if (classSettingName != null) {
      const value = DOM.getData(element, "class-value");
      const isSet = DOM.hasClass(element, value);
      this.settings.set(classSettingName, isSet);
    }
  }

  styleChange(element, oldValue, newValue) {
    log.debug("style change");
    const styleSettingName = DOM.getData(element, "style-setting-name");
    if (styleSettingName != null) {
      const styleName = DOM.getData(element, "style");
      const styleValue = element.style[styleName];
      this.settings.set(styleSettingName, styleValue);
    }
  }
  newElement(element) {
    log.debug("new element");
    this.updateSettings(element);
  }

  updateSettings(element) {
    const styleName = DOM.getData(element, "style-setting-name");
    if (styleName != null) {
      const style = DOM.getData(element, "style");
      if (style != null) {
        const value = this.settings.get(styleName);
        element.style[style] = value;
      }
    }
    const classSettingName = DOM.getData(element, "class-setting-name");
    if (classSettingName != null) {
      const value = DOM.getData(element, "class-value");
      const isSet = this.settings.get(classSettingName);
      DOM.toggleClass(element, value, isSet);
    }
  }
}

const watcher = new SettingWatcher();
export { watcher };
export default watcher;
