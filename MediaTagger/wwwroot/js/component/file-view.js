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
  BuildScrollHandler,
} from "../../drjs/browser/event.js";
import MediaDetailsComponent from "./media-details.js";
import DateFilterComponent from "./date-filter.js";
import MediaFilterComponent from "./media-filter.js";
import Media from "../modules/media.js";
import { GridLayout } from "../modules/layout.js";
import UTIL from "../../drjs/util.js";

import { ZoomEvent } from "../component/view-options.js";

import { ImageLoader } from "../modules/image-loader.js";

const log = Logger.create("FileView", LOG_LEVEL.DEBUG);

export class FileViewComponent extends ComponentBase {
  constructor(selector, htmlName = "media") {
    super(selector, htmlName);
    this.listeners = new Listeners();
    this.activeItem = null;
  }

  async onFileHoverStart(data, target) {
    log.never("file hover start ", data.getName());
    this.activeItem = data;

    var offset = this.dom.getPageOffset(target);
    this.popup.style.top = `${offset.bottom}px`;
    this.popup.style.left = `${offset.left}px`;
    this.dom.removeClass(this.popup, "hidden");
    this.dom.toggleClass(this.popup, "grouped", data.isInGroup());
  }
  async onFileHoverEnd(data, target) {
    this.activeItem = null;
    log.never("file hover end ", data.getName());
    this.dom.addClass(this.popup, "hidden");
  }

  async fillPopup() {
    this.dom.removeClass(this.popup, "hidden");
    this.dom.toggleClass(
      this.popup,
      "grouped",
      this.activeItem && this.activeItem.isInGroup()
    );
  }
  async hidePopup() {
    this.activeItem = null;
    this.dom.addClass(this.popup, "hidden");
  }

  async onHtmlInserted(elements) {
    this.imageLoader = new ImageLoader(".media-items");
    this.mediaDetails = new MediaDetailsComponent("#media-details");
    this.dateFilter = new DateFilterComponent("#date-filter");
    this.mediaFilter = new MediaFilterComponent("#media-filter");
    this.popup = this.dom.first(".file.popup");

    var allItems = await Media.getVisibleItems();
    var template = new HtmlTemplate(this.dom.first("#media-item-template"));

    this.layout = new GridLayout(".items", allItems, (item) => {
      var htmlItem = template.fill({
        ".media-item": [new DataValue("file-id", item.getId())],
        ".name": item.name,
        ".thumbnail": [
          new DataValue("file-id", item.getId()),
          new AttributeValue("src", `/thumbnail/${item.getId()}?v=6`),
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
      BuildClickHandler()
        .listenTo(".popup")
        .selector("button.group")
        .onClick(this, this.groupSelectedItems)
        .build(),
      BuildClickHandler()
        .listenTo(".popup")
        .selector("button.ungroup")
        .onClick(this, this.ungroupItem)
        .build(),
      BuildHoverHandler()
        .listenTo(".media-items")
        .selector([".media-item"])
        .include([".popup"])
        .onStart(this, this.onFileHoverStart)
        .onEnd(this, this.onFileHoverEnd)
        .setData((element) => {
          return Media.getAllFiles().findById(
            this.dom.getData(element, "file-id")
          );
        })
        .build(),
      ZoomEvent.createListener(this, this.hidePopup),
      BuildScrollHandler()
        .listenTo(".items")
        .onScroll(this, this.hidePopup)
        .build()
    );
  }

  async groupSelectedItems() {
    log.debug("group selected items");
    Media.groupSelectedItems(this.activeItem);
    this.hidePopup();
  }

  async ungroupItem() {
    log.debug("ungroup item");
    Media.ungroup(this.activeItem);
    this.hidePopup();
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
