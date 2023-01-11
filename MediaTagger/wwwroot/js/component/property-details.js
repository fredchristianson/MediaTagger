import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import { ComponentBase } from "../../drjs/browser/component.js";
import {
  BuildCheckboxHandler,
  BuildClickHandler,
  Listeners,
} from "../../drjs/browser/event.js";
import {
  HtmlTemplate,
  PropertyValue,
} from "../../drjs/browser/html-template.js";
import { FilterChangeEvent, media } from "../modules/media.js";
import Settings from "../modules/settings.js";

const log = Logger.create("PropertyDetails", LOG_LEVEL.DEBUG);

export class PropertyDetailsComponent extends ComponentBase {
  constructor(selector, htmlName = "property-details") {
    super(selector, htmlName);
    this.listeners = new Listeners();
    this.sizes = [];
    this.resolutions = [];
    this.extensions = [];
  }

  async onHtmlInserted(elements) {
    this.settings = await Settings.load("property-details");

    this.listeners.add(
      // this.selection
      //   .getUpdatedEvent()
      //   .createListener(this, this.onSelectionChanged)
      media.getFocusChangeEvent().createListener(this, this.focusChange)
    );
  }

  focusChange() {
    var focus = media.getFocus();
    this.dom.show(".properties", focus != null);
    if (focus == null) {
      return;
    }
    var sel = media.getSelectedItems();
    if (sel.getLength() == 1) {
      this.dom.setInnerHTML("h1.name", focus.getName());
    } else {
      this.dom.show("h1.name");
      this.dom.setInnerText(
        "h1.name",
        `${focus.getName()} (+ ${sel.getLength() - 1})`
      );
    }
    this.dom.setInnerHTML(".extension", focus.getExtension());
    this.dom.setInnerHTML(
      ".resolution",
      `${focus.getWidth()} x ${focus.getHeight()}`
    );
    this.dom.setAttribute(".preview img", "src", `/image/${focus.getId()}`);
    this.dom.removeClass(".preview", [`rotate-90`, "rotate-180", "rotate-270"]);
    var preview = this.dom.first(".preview");
    var img = this.dom.first(preview, "img");
    if (focus.RotationDegrees) {
      this.dom.addClass(
        ".preview",
        `rotate-${(focus.RotationDegrees + 360) % 360}`
      );
    }
    if (focus.RotationDegrees == 90 || focus.RotationDegrees == 270) {
      img.style.maxWidth = `${preview.offsetHeight}px`;
      img.style.maxHeight = `${preview.offsetWidth}px`;
      img.style.left = `${(preview.offsetWidth - img.offsetWidth) / 2}px`;
    } else {
      img.style.maxHeight = `${preview.offsetHeight}px`;
      img.style.maxWidth = `${preview.offsetWidth}px`;
      img.style.left = "0px";
    }
  }
}

export default PropertyDetailsComponent;
