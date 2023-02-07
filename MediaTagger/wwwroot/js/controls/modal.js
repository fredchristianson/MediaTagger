import { dom } from '../../drjs/browser/dom.js';
import { LOG_LEVEL, Logger } from '../../drjs/logger.js';
const log = Logger.create('Modal', LOG_LEVEL.DEBUG);
log.never();
import { Listeners, BuildMouseHandler } from '../../drjs/browser/event.js';

class Modal {
  constructor(onCancel = null) {
    this.listeners = new Listeners();
    this.onCancel = onCancel;
  }
  show() {
    let modal = dom.first('.mt-modal');
    if (modal == null) {
      modal = dom.createElement("<div class='mt-modal'></div>");
      dom.append('body', modal);
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
    let modal = dom.first('.mt-modal');
    if (modal != null) {
      dom.remove(modal);
    }
  }
}

export { Modal };
