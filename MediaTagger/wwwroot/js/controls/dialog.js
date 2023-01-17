import dom, { DOM } from "../../drjs/browser/dom.js";
import HtmlTemplate from "../../drjs/browser/html-template.js";
import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
const log = Logger.create("Dialog", LOG_LEVEL.DEBUG);
import {
  Listeners,
  BuildKeyHandler,
  BuildInputHandler,
  BuildClickHandler,
} from "../../drjs/browser/event.js";
import { Modal } from "./modal.js";

class Dialog {
  constructor(form, onOk = null, onCancel = null) {
    this.form = form;
    this.listeners = new Listeners();
    this.onOk = onOk;
    this.onCancel = onCancel;
  }

  show(parent = document.body, values = {}) {
    var contents = null;
    if (this.form instanceof HtmlTemplate) {
      contents = this.form.fill(values);
    } else if (typeof this.form == "string") {
      contents = dom.createElement(this.form);
    } else {
      contents = this.form;
    }
    this.modal = new Modal(() => {
      this.cancelDialog();
    });
    this.modal.show();

    this.dialogElement = dom.append(parent, contents);
    this.listeners.removeAll();
    this.listeners.add(
      BuildKeyHandler().onEscape(this, this.cancelDialog).build(),
      BuildKeyHandler().onEnter(this, this.saveDialog).build(),
      BuildInputHandler().onInput(this, this.validate).build(),
      BuildClickHandler()
        .listenTo(this.dom, ".ok")
        .onClick(this, this.saveDialog)
        .build(),
      BuildClickHandler()
        .listenTo(this.dom, ".cancel")
        .onClick(this, this.cancelDialog)
        .build()
    );
    this.dom = new DOM(this.dialogElement);
    this.dom.setFocus(this.dom.first("input"));
    this.isValid = false;
    this.validate();
  }

  validate() {
    var invalid = this.dom.first(":invalid");
    this.isValid = invalid == null;
    const ok = this.dom.find(".ok");
    this.dom.setProperty(ok, "disabled", !this.isValid);
  }
  cancelDialog() {
    log.debug("cancel");
    if (this.onCancel) {
      this.onCancel();
    }
    dom.remove(this.dialogElement);
    this.listeners.removeAll();
    this.dialogElement = null;
    this.modal.hide();
  }

  async saveDialog() {
    if (!this.isValid) {
      log.warn("save attempted with invalid data");
      return;
    }
    log.debug("save");
    if (this.onOk) {
      try {
        const values = this.dom.getFormValues(".body");
        const result = await this.onOk(values);
        if (result !== true) {
          this.dom.setInnerHTML(".messages", result);
          return;
        }
      } catch (ex) {
        this.dom.setInnerHTML(".messages", "failed: " + ex.message);
        return;
      }
    }

    dom.remove(this.dialogElement);
    this.listeners.removeAll();
    this.dialogElement = null;
    this.modal.hide();
  }
}

class ModalDialog extends Dialog {}
export { Dialog, ModalDialog };
