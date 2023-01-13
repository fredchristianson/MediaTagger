import { ComponentBase } from "../../drjs/browser/component.js";
import {
  BuildCheckboxHandler,
  BuildHoverHandler,
  BuildInputHandler,
  EventHandlerReturn,
  Listeners,
  StopAllHandlerReturn,
} from "../../drjs/browser/event.js";
import { BuildClickHandler } from "../../drjs/browser/event.js";
import {
  HtmlTemplate,
  PropertyValue,
  DataValue,
  AttributeValue,
} from "../../drjs/browser/html-template.js";
import { media, FilterChangeEvent } from "../modules/media.js";
import { Settings } from "../modules/settings.js";
import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import Album from "../data/album.js";
import { Dialog } from "../controls/dialog.js";
import { dom } from "../../drjs/browser/dom.js";

const log = Logger.create("AlbumComponent", LOG_LEVEL.DEBUG);

function NameCompareFunction(a, b) {
  if (a == null) {
    return -1;
  }
  if (b == null) {
    return -1;
  }
  return a.getName().localeCompare(b.getName());
}

class AlbumDetailsComponent extends ComponentBase {
  constructor(selector, htmlName = "album-details") {
    super(selector, htmlName);
    this.listeners = new Listeners();
    this.media = media;
  }

  async onHtmlInserted(elements) {
    this.template = new HtmlTemplate(this.dom.first(".album-details-template"));

    this.listeners.add(
      BuildCheckboxHandler()
        .listenTo(this.dom.first("ul"), "input[type='checkbox']")
        .onChange(this, this.selectChanged)
        .setData((element) => {
          return this.dom.getDataWithParent(element, "id");
        })
        .build()
    );
  }
}

export { AlbumDetailsComponent };
