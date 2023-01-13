import dom, { DOM } from "../../drjs/browser/dom.js";
import HtmlTemplate from "../../drjs/browser/html-template.js";
import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
const log = Logger.create("Modal", LOG_LEVEL.DEBUG);
import {
  Listeners,
  BuildClickHandler,
  BuildCheckboxHandler,
  BuildMouseHandler,
} from "../../drjs/browser/event.js";

class Modal {
  constructor(onCancel = null) {
    this.listeners = new Listeners();
    this.onCancel = onCancel;
  }
  show() {
    var modal = dom.first(".mt-modal");
    if (modal == null) {
      modal = dom.createElement("<div class='mt-modal'></div>");
      dom.append("body", modal);
      this.listeners.add(
        BuildMouseHandler()
          .listenTo(modal)
          .onMouseDown(this, this.cancel)
          .capture()
          .build()
      );
    }
    dom.show(modal);
  }

  cancel() {
    if (this.onCancel) {
      this.onCancel();
    }
    this.hide();
  }
  hide() {
    var modal = dom.first(".mt-modal");
    if (modal != null) {
      dom.remove(modal);
    }
  }
}

export { Modal };
