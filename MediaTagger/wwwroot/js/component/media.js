import { ComponentBase } from "../../drjs/browser/component.js";
import {
  HtmlTemplate,
  ReplaceTemplateValue,
} from "../../drjs/browser/html-template.js";
import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import { Listeners } from "../../drjs/browser/event.js";
import MediaDetailsComponent from "./media-details.js";
import DateFilterComponent from "./date-filter.js";
import MediaFilterComponent from "./media-filter.js";
import Media from "../modules/media.js";
import { GridLayout } from "../modules/layout.js";
import UTIL from "../../drjs/util.js";
import asyncLoader from "../modules/async-loader.js";

const log = Logger.create("MediaComponent", LOG_LEVEL.INFO);
import api from "../mt-api.js";

var MAX_MEDIA_ITEMS = 5000;

export class MediaComponent extends ComponentBase {
  constructor(selector, htmlName = "media") {
    super(selector, htmlName);
    this.loadCompleteHandler = this.loadComplete.bind(this);
    this.loadErrorHandler = this.loadError.bind(this);
    this.doLoadNext = this.loadNext.bind(this);
    this.listeners = new Listeners();
  }

  async onHtmlInserted(elements) {
    this.mediaDetails = new MediaDetailsComponent("#media-details");
    this.dateFilter = new DateFilterComponent("#date-filter");
    this.mediaFilter = new MediaFilterComponent("#media-filter");

    var allItems = await Media.getVisibleItems();
    var template = new HtmlTemplate(this.dom.first("#media-item-template"));

    this.layout = new GridLayout(".items", allItems, (item) => {
      var htmlItem = template.fill({
        ".name": item.name,
        ".thumbnail": new ReplaceTemplateValue("{id}", item.primaryFileId),
      });
      asyncLoader.setConcurrentLoadLimit(5);
      return htmlItem;
    });

    // load multiple images at a time but limit
    this.scheduled = 0;
    this.running = 0;
    for (var cnt = 0; cnt < 5; cnt++) {
      this.scheduleLoadNext();
    }
  }



  scheduleLoadNext() {
    if (this.running > 5 || this.scheduled > 5) {
      log.error("too many requests");
      return;
    }
    setTimeout(this.doLoadNext, 0);
    this.scheduled += 1;
    log.never("scheduled " + this.scheduled);
  }
  loadNext() {
    this.scheduled -= 1;
    this.running += 1;
    log.never("running " + this.running + "scheduled " + this.scheduled);
    // first do ones in view
    var img = this.dom.first(".in-view [data-unloaded='true']");
    if (img == null) {
      // none in view so get the next
      img = this.dom.first("[data-unloaded='true']");
    }
    if (img == null) {
      // none still .loading, so done
      this.running -= 1;
      log.never("running " + this.running + "scheduled " + this.scheduled);

      return;
    }
    if (img.loadComplete) {
      this.scheduleLoadNext();
      return;
    }
    var src = this.dom.getData(img, "src");
    if (!UTIL.isEmpty(src)) {
      this.dom.setData(img, "unloaded", "false");
      this.dom.setData(img, "loading", "true");
      var parent = img.parentNode;
      var name = this.dom.first(parent, ".name").innerText;
      log.never("loading ", name, " ", src);
      img.addEventListener("load", this.loadCompleteHandler);
      img.addEventListener("error", this.loadErrorHandler);

      img.setAttribute("src", src + "?v=1");
      if (img.loadComplete) {
        this.dom.setData(img, "loading", "false");
        img.removeEventListener("load", this.loadCompleteHandler);
        img.removeEventListener("error", this.loadErrorHandler);
        this.running -= 1;
        this.scheduleLoadNext();
        log.never("already loaded");
      }
    } else {
      log.never("done loading");
    }
  }

  loadComplete(event) {
    log.never("loaded");
    var img = event.target;
    if (this.dom.getData(img, "loading") != "true") {
      return;
    }
    this.dom.setData(img, "loading", "false");
    img.removeEventListener("error", this.loadErrorHandler);
    img.removeEventListener("load", this.loadCompleteHandler);
    this.running -= 1;
    this.scheduleLoadNext();
  }

  loadError(event) {
    var img = event.target;
    log.never("error ");
    img.removeEventListener("error", this.loadErrorHandler);
    img.removeEventListener("error", this.loadCompleteHandler);
    this.dom.removeClass(img, "load-waiting");
    this.dom.removeClass(img, "loading");
    this.dom.addClass(img, "error");
    img.setAttribute("src", "image/error.png");
    this.running -= 1;
    this.scheduleLoadNext();
  }
}

export default MediaComponent;
