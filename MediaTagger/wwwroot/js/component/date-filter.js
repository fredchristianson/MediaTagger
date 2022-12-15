import { ComponentBase } from "../../drjs/browser/component.js";
import Media from "../modules/media.js";
import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
const log = Logger.create("DateFilter", LOG_LEVEL.DEBUG);
import {
  BuildHoverHandler,
  BuildMouseHandler,
} from "../../drjs/browser/event.js";

export class DateFilterComponent extends ComponentBase {
  constructor(selector, htmlName = "date-filter") {
    super(selector, htmlName);
  }

  async onHtmlInserted(elements) {
    this.svg = this.dom.first("svg");
    Media.getVisibleItems()
      .getUpdatedEvent()
      .createListener(this, this.onItemsUpdated);
    this.onItemsUpdated(Media.getVisibleItems());
    BuildHoverHandler()
      .listenTo(this.dom.first(".svg-container"))
      .onStart(this, this.startHover)
      .onEnd(this, this.endHover)
      .include([".date-popup", ".media-items"])
      .endDelayMSecs(300)
      .build();
    this.test = 3;
    BuildMouseHandler()
      .listenTo(this.dom.first(".svg-container"))
      .onMouseMove(this)
      .onLeftUp(this, this.setStartDate)
      .onRightUp(this, this.setEndDate)
      .onLeftDown(() => {
        log.debug("left down");
      })
      .onRightDown(this, () => {
        log.debug("right down ", this.test);
      })
      .build();
  }

  setStartDate() {
    log.debug("start date");
  }
  setEndDate() {
    log.debug("end date");
  }
  startHover() {
    log.debug("start hover");
  }

  endHover() {
    log.debug("end hover");
  }

  onMouseMove(pos, event, data, handler) {
    log.debug(`move: `, pos);
  }

  onItemsUpdated(collection) {
    var start = null;
    var end = null;
    var photosPerDay = {};
    for (var item of collection) {
      var taken = item.getDateTaken();
      if (start == null || start > taken) {
        start = taken;
      }
      if (end == null || end < taken) {
        end = taken;
      }
      if (photosPerDay[taken] == null) {
        photosPerDay[taken] = 1;
      } else {
        photosPerDay[taken] += 1;
      }
    }
    this.dom.setInnerHTML(
      ".start",
      start
        ? start.toLocaleDateString({
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "---"
    );
    this.dom.setInnerHTML(
      ".end",
      end
        ? end.toLocaleDateString({
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "---:"
    );
  }
}

export default DateFilterComponent;
