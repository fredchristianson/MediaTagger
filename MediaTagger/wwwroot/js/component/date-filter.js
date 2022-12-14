import { ComponentBase } from "../../drjs/browser/component.js";
import Media from "../modules/media.js";

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
  }

  onItemsUpdated(collection) {
    var start = null;
    var end = null;
    var photosPerDay = {};
    for (var item of collection) {
      var taken = item.getDateTaken();
      if (start == null || start < taken) {
        start = taken;
      }
      if (end == null || end > taken) {
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
      start.toLocaleDateString({
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    );
    this.dom.setInnerHTML(
      ".end",
      end.toLocaleDateString({
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    );
  }
}

export default DateFilterComponent;
