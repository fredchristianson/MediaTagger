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

const log = Logger.create("MediaComponent", LOG_LEVEL.DEBUG);

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
        ".media-item": [new DataValue("media-id", item.getId())],
        ".name": item.name,
        ".thumbnail": new ReplaceTemplateValue(
          "{thumbnail}",
          item.getThumbnailUrl.bind(item)
        ),
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
            item: Media.getAllItems().getById(
              this.dom.getData(element, "mediaid")
            ),
            file: Media.getAllItems().getById(
              this.dom.getData(element, "fileid")
            ),
          };
        })
        .build()
    );
  }

  async onDetach() {
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

export default MediaComponent;
