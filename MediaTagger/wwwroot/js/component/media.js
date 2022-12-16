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
        ".thumbnail": new ReplaceTemplateValue(
          "{thumbnail}",
          item.getThumbnailUrl.bind(item)
        ),
      });
      asyncLoader.setConcurrentLoadLimit(5);
      return htmlItem;
    });
  }

  async onDetach() {
    this.layout.detach();
  }
}

export default MediaComponent;
