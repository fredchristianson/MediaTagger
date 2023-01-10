import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import {
  EventEmitter,
  ObjectEventType,
  Listeners,
  BuildClickHandler,
  HandlerResponse,
} from "../../drjs/browser/event.js";
import UTIL from "../../drjs/util.js";
import { BuildKeyHandler } from "../../drjs/browser/event-handler/key-handler.js";
const log = Logger.create("Navigation", LOG_LEVEL.DEBUG);

class Navigation {
  constructor(layout) {
    this.layout = layout;

    this.listeners = new Listeners(
      BuildKeyHandler()
        .onEnter(this)
        .onEscape(this)
        .onKey("a", this, this.keyA)
        .build(),
      BuildKeyHandler().onKeyDown(this, this.onKeyDown).build(),
      BuildKeyHandler().onKeyUp(this).build(),
      BuildKeyHandler().onKey("a", this, this.keyAA).build()
    );
  }

  detach() {
    this.listeners.removeAll();
  }

  onKeyDown(key, target, event) {
    log.debug("key down ", key);
  }

  onKeyUp(key, target, event) {
    log.debug("key up ", key);
  }

  onEnter() {
    log.debug("enter");
  }

  onEscape() {
    log.debug("escape");
  }
  keyA(key, target, event) {
    log.debug("key A ", key);
    return HandlerResponse.StopAll;
  }
  keyAA(key, target, event) {
    log.debug("key AA ", key);
    return HandlerResponse.Continue;
  }
}

export { Navigation };
