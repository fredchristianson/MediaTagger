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
import { GridLayout } from "../modules/layout.js";
import UTIL from "../../drjs/util.js";

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

    this.layout = new GridLayout(".items");
    var allItems = await api.GetAllMediaItems();
    allItems.splice(MAX_MEDIA_ITEMS, allItems.length);
    var template = new HtmlTemplate(this.dom.first("#media-item-template"));
    log.never("got ", allItems.length, " media items");
    setTimeout(() => {
      this.insertNextItems(template, allItems);
    }, 0);

    // load multiple images at a time but limit
    this.scheduled = 0;
    this.running = 0;
    for (var cnt = 0; cnt < 5; cnt++) {
      this.scheduleLoadNext();
    }
  }

  insertNextItems(template, items) {
    var toInsert = [];
    for (var i = 0; i < items.length && i < 1000; i++) {
      var item = items[i];
      var htmlItem = template.fill({
        ".name": item.name,
        ".thumbnail": new ReplaceTemplateValue("{id}", item.primaryFileId),
      });
      //var newNode = this.dom.append(items, htmlItem);
      //this.layout.addItem(htmlItem);
      toInsert.push(htmlItem);
    }
    this.layout.addItems(toInsert);
    items.splice(0, toInsert.length);
    if (items.length > 0) {
      setTimeout(() => this.insertNextItems(template, items), 0);
    } else {
      log.info("all items inserted");
    }
  }

  intersectionChange(entries, observer) {
    log.never("intersection change");
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        this.dom.addClass(entry.target, "in-view");
      } else {
        this.dom.removeClass(entry.target, "in-view");
      }
    });
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
