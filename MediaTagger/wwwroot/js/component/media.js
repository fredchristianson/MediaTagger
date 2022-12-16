import { ComponentBase } from "../../drjs/browser/component.js";
import {
  HtmlTemplate,
  ReplaceTemplateValue,
  DataValue,
} from "../../drjs/browser/html-template.js";
import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import { Listeners, BuildClickHandler } from "../../drjs/browser/event.js";
import MediaDetailsComponent from "./media-details.js";
import DateFilterComponent from "./date-filter.js";
import MediaFilterComponent from "./media-filter.js";
import Media from "../modules/media.js";
import { GridLayout } from "../modules/layout.js";
import UTIL from "../../drjs/util.js";
import asyncLoader from "../modules/async-loader.js";

const log = Logger.create("MediaComponent", LOG_LEVEL.DEBUG);
import api from "../mt-api.js";

var MAX_MEDIA_ITEMS = 5000;

export class MediaComponent extends ComponentBase {
  constructor(selector, htmlName = "media") {
    super(selector, htmlName);
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
        ".media-item": [
          new DataValue("mediaId", item.getId()),
          new DataValue("fileId", item.getFileId()),
        ],
        ".name": item.name,
        ".thumbnail": new ReplaceTemplateValue(
          "{thumbnail}",
          item.getThumbnailUrl.bind(item)
        ),
      });
      asyncLoader.setConcurrentLoadLimit(5);
      return htmlItem;
    });
    this.listeners.add(
      BuildClickHandler()
        .listenTo(this.dom, ".media-item")
        .onClick(this, this.clickItem)
        .onLeftClick(this, this.leftClick)
        .onRightClick(this, this.rightClick)
        .onMiddleClick(this, this.middleClick)
        .build()
    );
  }

  async onDetach() {
    this.layout.detach();
    this.listeners.removeAll();
  }

  clickItem(item, data, event, handler) {
    log.debug("click item ");
  }
  leftClick(item, data, event, handler) {
    log.debug("leftClick item ");
  }
  rightClick(item, data, event, handler) {
    log.debug("right click item ");
  }
  middleClick(item, data, event, handler) {
    log.debug("middle click item ");
  }
}

export default MediaComponent;
