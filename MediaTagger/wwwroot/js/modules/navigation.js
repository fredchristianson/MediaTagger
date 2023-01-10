import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import {
  EventEmitter,
  ObjectEventType,
  Listeners,
  BuildClickHandler,
  EventHandlerReturn,
} from "../../drjs/browser/event.js";
import { media } from "./media.js";
import UTIL from "../../drjs/util.js";
import {
  BuildKeyHandler,
  Key,
} from "../../drjs/browser/event-handler/key-handler.js";
const log = Logger.create("Navigation", LOG_LEVEL.DEBUG);

class Navigation {
  constructor(layout) {
    this.layout = layout;
    this.items = media.getVisibleItems();
    this.focusIndex = 0;
    this.focusItem = this.items.getItemAt(this.focusIndex);

    this.listeners = new Listeners(
      BuildKeyHandler()
        .ifActive()
        .onEnter(this)
        .onEscape(this)
        .onKey(Key.UpArrow, this, this.moveUp)
        .onKey(Key.DownArrow, this, this.moveDown)
        .onKey(Key.RightArrow, this, this.moveNext)
        .onKey(Key.LeftArrow, this, this.movePrev)
        .onKey(Key.Home, this, this.moveStart)
        .onKey(Key.End, this, this.moveEnd)
        .onKeyDown(this, this.onKeyDown)
        .build(),

      this.items.getUpdatedEvent().createListener(this, this.itemsChanged)
    );
    this.changeIndex(0);
  }

  itemsChanged(list) {
    this.items = list;
    var newIndex = list.indexOf(this.focusItem);
    if (newIndex == null || newIndex < 0) {
      this.focusIndex = Math.min(this.focusIndex, list.getLength() - 1);
      this.focusItem = list.getItemAt(this.focusIndex);
    } else {
      this.focusIndex = newIndex;
    }
    this.changeIndex(newIndex);
  }

  changeIndex(index, extendSelect) {
    this.focusIndex = Math.max(0, Math.min(index, this.items.getLength() - 1));
    this.focusItem = this.items.getItemAt(this.focusIndex);
    this.layout.setFocus(this.focusItem);
    if (extendSelect) {
      media.selectToItem(this.focusItem);
    } else {
      media.selectItem(this.focusItem);
    }
  }

  moveUp(key, target, event) {
    this.changeIndex(
      this.focusIndex - this.layout.getNavigationStepCount(),
      event.hasShift
    );
  }
  moveDown(key, target, event) {
    this.changeIndex(
      this.focusIndex + this.layout.getNavigationStepCount(),
      event.hasShift
    );
  }
  movePrev(key, target, event) {
    this.changeIndex(this.focusIndex - 1, event.hasShift);
  }
  moveNext(key, target, event) {
    this.changeIndex(this.focusIndex + 1, event.hasShift);
  }

  moveStart(key, target, event) {
    this.changeIndex(0, event.hasShift);
  }
  moveEnd(key, target, event) {
    this.changeIndex(this.items.getLength() - 1, event.hasShift);
  }

  detach() {
    this.listeners.removeAll();
  }

  onKeyDown(key, target, event) {
    log.debug("key down ", key);
  }
}

export { Navigation };
