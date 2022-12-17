import { ComponentBase } from "../../drjs/browser/component.js";
import Media from "../modules/media.js";
import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
const log = Logger.create("DateFilter", LOG_LEVEL.DEBUG);
import {
  BuildClickHandler,
  BuildHoverHandler,
  BuildMouseHandler,
  Listeners,
} from "../../drjs/browser/event.js";

export class DateFilterComponent extends ComponentBase {
  constructor(selector, htmlName = "date-filter") {
    super(selector, htmlName);
    this.startDate = null;
    this.endDate = null;
  }

  async onHtmlInserted(elements) {
    this.svg = this.dom.first("svg");
    this.popup = this.dom.first(".popup-details");
    this.listeners = new Listeners(
      Media.getVisibleItems()
        .getUpdatedEvent()
        .createListener(this, this.onItemsUpdated),
      BuildHoverHandler()
        .listenTo(this.dom.first(".svg-container"))
        .onStart(this, this.startHover)
        .onEnd(this, this.endHover)
        .include([".date-popup", ".edge"])
        .endDelayMSecs(300)
        .disableContextMenu()
        .build(),
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
        .build(),
      BuildClickHandler()
        .listenTo(".date-select .start")
        .onClick(this, this.resetStart)
        .build(),
      BuildClickHandler()
        .listenTo(".date-select .end")
        .onClick(this, this.resetEnd)
        .onRightClick(this, this.resetEnd)
        .build()
    );

    this.onItemsUpdated(Media.getVisibleItems());

    this.fillSvg();
  }

  resetStart() {
    this.startDate = this.earliestDate;
    this.fillSvg();
    Media.setDateFilter(this.startDate, this.endDate);
  }

  resetEnd() {
    this.endDate = this.latestDate;
    this.fillSvg();
    Media.setDateFilter(this.startDate, this.endDate);
  }
  datePercent(date) {
    if (date == null || isNaN(date)) {
      return 0;
    }
    var dist = date - this.startDate;
    var total = this.endDate - this.startDate;
    return Math.floor(total == 0 ? 0 : (dist * 100) / total);
  }
  createRect(item) {
    var rect = this.dom.createElementNS("rect", {
      "@x": `${this.datePercent(item.getDateTaken())}%`,
    });
    //rect.style.left = `${this.datePercent(item.getDateTaken())}%`;
    //rect.style.top = `0%`;
    // rect.x = `${this.datePercent(item.getDateTaken())}%`;
    // rect.y = "0";
    // rect.width = "2px";
    return rect;
  }
  fillSvg() {
    if (this.startDate == null) {
      this.startDate = this.earliestDate;
    }
    if (this.endDate == null) {
      this.endDate = this.latestDate;
    }
    this.dom.setInnerHTML(
      ".start",
      this.dateString(this.startDate || this.earliestDate)
    );
    this.dom.setInnerHTML(
      ".end",
      this.dateString(this.endDate || this.latestDate)
    );

    var buckets = [...Media.getVisibleItems()].reduce((bucket, item) => {
      var date = item.getDateTaken();
      var pct = this.datePercent(date);
      if (bucket[pct] == null) {
        bucket[pct] = {
          count: 1,
          percent: pct,
          start: date,
          end: date,
          firstItem: item,
          lastItem: item,
        };
      } else {
        bucket[pct].count += 1;
        if (date.getTime() < bucket[pct].start.getTime()) {
          bucket[pct].start = date;
          bucket[pct].firstItem = item;
        }
        if (date.getTime() > bucket[pct].end.getTime()) {
          bucket[pct].end = date;
          bucket[pct].lastItem = item;
        }
      }

      return bucket;
    }, []);
    this.buckets = buckets;
    this.dom.removeChildren(this.svg);
    // for (var item of Media.getVisibleItems()) {
    //   this.dom.append(this.svg, this.createRect(item));
    // }
    for (var bucket of buckets) {
      if (bucket != null) {
        var rect = this.dom.createElementNS("rect", {
          "@x": `${bucket.percent}%`,
        });
        rect.style.opacity = Math.max(50, Math.min(bucket.count, 100)) / 100;
        this.dom.append(this.svg, rect);
      }
    }
  }

  setStartDate(pos) {
    log.debug("start date", pos.x);
    var num = pos.xPercent();
    var bucket = this.buckets[num];
    while (num >= 0 && bucket == null) {
      num--;
      bucket = this.buckets[num];
    }
    if (bucket) {
      this.startDate = bucket.start;
      Media.setDateFilter(this.startDate, this.endDate);
      this.fillSvg();
    }
  }
  setEndDate(pos) {
    log.debug("start date", pos.x);
    var num = pos.xPercent();
    var bucket = this.buckets[num];
    while (num < 100 && bucket == null) {
      num++;
      bucket = this.buckets[num];
    }
    if (bucket) {
      this.endDate = bucket.end;
      Media.setDateFilter(this.startDate, this.endDate);
      this.fillSvg();
    }
  }
  startHover() {
    log.never("start hover");
    var svgpos = this.dom.getPageOffset(this.svg);

    //this.popup.style.top = `${svgpos.bottom}px`;
    // absolute position relative to date div, not body
    this.popup.style.top = `${svgpos.height}px`;
  }

  endHover() {
    log.never("end hover");
    this.dom.removeClass(this.popup, "show");
  }

  onMouseMove(pos, event, data, handler) {
    log.never(`move: `, event.clientX);
    var num = Math.floor(pos.pctX * 100);
    var bucket = this.buckets[num];
    log.never("show bucket ", num, bucket ? " exists " : "empty");
    if (bucket && bucket.firstItem) {
      this.dom.first(this.popup, "img").src =
        bucket.firstItem.getThumbnailUrl();
      this.dom.first(this.popup, "img.last").src =
        bucket.lastItem.getThumbnailUrl();
      this.dom.first(this.popup, ".date").innerHTML = this.dateString(
        bucket.firstItem.getDateTaken()
      );
      this.dom.addClass(this.popup, "show");
      this.popup.style.left = `${event.clientX}px`;
      this.popup.style.transform = `translate(-${pos.xPercent()}%)`;
    } else {
      this.dom.removeClass(this.popup, "show");
    }
  }

  onItemsUpdated() {
    var start = null;
    var end = null;
    var photosPerDay = {};
    for (var item of Media.getAllItems()) {
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
    this.earliestDate = start;
    this.latestDate = end;

    this.fillSvg();
  }

  dateString(date) {
    if (date == null || !(date instanceof Date)) {
      return "---";
    }
    return date.toLocaleDateString({
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
}

export default DateFilterComponent;
