import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import { ComponentBase } from "../../drjs/browser/component.js";
import {
  BuildCheckboxHandler,
  BuildClickHandler,
  Listeners,
  HandlerResponse,
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

    this.selection = media.getSelectedItems();
    this.listeners.add(
      this.selection
        .getUpdatedEvent()
        .createListener(this, this.onSelectionChanged)
    );
  }

  onSelectionChanged(sel) {
    var focus = media.getFocus();
    this.dom.show(".properties", focus != null);
    if (focus == null) {
      return;
    }
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
    this.dom.setAttribute("img", "src", `/image/${focus.getId()}`);
  }
}

export default PropertyDetailsComponent;
