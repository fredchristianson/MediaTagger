import { ComponentBase } from "../../drjs/browser/component.js";
import {
  HtmlTemplate,
  ReplaceTemplateValue,
  DataValue,
  AttributeValue,
} from "../../drjs/browser/html-template.js";
import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import {
  Listeners,
  BuildClickHandler,
  BuildHoverHandler,
} from "../../drjs/browser/event.js";
import MediaDetailsComponent from "./media-details.js";
import DateFilterComponent from "./date-filter.js";
import MediaFilterComponent from "./media-filter.js";
import Media from "../modules/media.js";
import { GridLayout } from "../modules/layout.js";
import UTIL from "../../drjs/util.js";

import { ImageLoader } from "../modules/image-loader.js";

const log = Logger.create("MediaComponent", LOG_LEVEL.DEBUG);

export class FileViewComponent extends ComponentBase {
  constructor(selector, htmlName = "media") {
    super(selector, htmlName);
    this.listeners = new Listeners();
  }

  async onFileHoverStart(pos, event, data, handler) {
    log.debug("file hover start");
  }
  async onFileHoverEnd() {
    log.debug("file hover end");
  }

  async onHtmlInserted(elements) {
    this.imageLoader = new ImageLoader(".media-items");
    this.mediaDetails = new MediaDetailsComponent("#media-details");
    this.dateFilter = new DateFilterComponent("#date-filter");
    this.mediaFilter = new MediaFilterComponent("#media-filter");

    var allItems = await Media.getVisibleItems();
    var template = new HtmlTemplate(this.dom.first("#media-item-template"));

    this.layout = new GridLayout(".items", allItems, (item) => {
      var htmlItem = template.fill({
        ".media-item": [new DataValue("file-id", item.getId())],
        ".name": item.name,
        ".thumbnail": [
          new DataValue("file-id", item.getId()),
          new AttributeValue("src", `/thumbnail/${item.getId()}?v=5`),
        ],
      });
      return htmlItem;
    });
    this.listeners.add(
      BuildClickHandler()
        .listenTo(this.dom, ".media-item")
        .onClick(this, this.clickItem)
        .onLeftClick(this, this.leftClick)
        .onRightClick(this, this.rightClick)
        .onMiddleClick(this, this.middleClick)
        .setData((element) => {
          return {
            item: Media.getAllFiles().findById(
              this.dom.getData(element, "file-id")
            ),
          };
        })
        .build(),
      BuildHoverHandler()
        .listenTo(".media-items")
        .selector([".media-item", ".popup"])
        .onStart(this, this.onFileHoverStart)
        .startDelayMSecs(300)
        .endDelayMSecs(300)
        .onEnd(this, this.onFileHoverEnd)
        .setData((element) => {
          return {
            item: Media.getAllFiles().findById(
              this.dom.getData(element, "file-id")
            ),
          };
        })
        .build()
    );
  }

  async onDetach() {
    this.imageLoader.stop();
    this.layout.detach();
    this.listeners.removeAll();
  }

  clickItem(element, data, event, handler) {
    log.debug("click element ");
  }
  leftClick(element, data, event, handler) {
    log.debug("leftClick element ");
    if (event.hasShift) {
      Media.selectToItem(data.item);
    } else if (event.hasCtrl) {
      Media.toggleSelectItem(data.item);
    } else {
      Media.selectItem(data.item);
    }
  }
  rightClick(element, data, event, handler) {
    Media.selectToItem(data.item);
  }
  middleClick(element, data, event, handler) {
    Media.toggleSelectItem(data.item);
  }
}

export default FileViewComponent;
