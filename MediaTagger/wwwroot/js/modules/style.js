import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import dom from "../../drjs/browser/dom.js";
const log = Logger.create("Style", LOG_LEVEL.DEBUG);

var zoomRule = `.media-items .media-item {    width: {ZOOM}px;    height: {ZOOM}px; transform:scale({SCALE});    background-color: green;}`;
//var zoomRule = `.media-items .media-item {       flex-basis: {FLEX-BASIS};}`;
export class StyleManager {
  constructor(name) {
    this.name = name;
    var sheet = dom.createElement("style", {
      class: "custom-style",
      title: name,
    });
    dom.append("head", sheet);
    this.sheet = Array.from(document.styleSheets).find((sheet) => {
      return sheet.title == name;
    });
    this.zoom = 100;
    this.insertStyles();
  }

  insertStyles() {
    var scale = this.zoom / 100.0;
    var pixels = 128.0 * scale;
    log.debug("Update zoom ", scale, pixels);
    var z = zoomRule.replace("{ZOOM}", pixels);
    z = z.replace("{SCALE}", scale);
    z = z.replace("{FLEX-BASIS}", "33%");
    if (this.sheet.rules.length > 0) {
      this.sheet.deleteRule(0);
    }
    this.sheet.insertRule(z, 0);
  }

  updateMediaZoom(zoom) {
    this.zoom = zoom;
    setTimeout(() => {
      this.insertStyles();
    }, 10);

    log.debug("change style zoom");
  }
}

var styleManager = new StyleManager("media-tagger-dynamic-style");
export default styleManager;
