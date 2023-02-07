import { LOG_LEVEL, Logger } from '../../drjs/logger.js';
import { Listeners } from '../../drjs/browser/event.js';
import { media } from './media.js';
import {
  BuildKeyHandler,
  Key
} from '../../drjs/browser/event-handler/key-handler.js';
const log = Logger.create('Navigation', LOG_LEVEL.DEBUG);

class Navigation {
  constructor(layout) {
    this.layout = layout;
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
        .onKey(Key.Escape, this, this.clearSelection)
        .onKey('[', media, media.rotateCCW)
        .onKey(']', media, media.rotateCW)
        .onKey('\\', media, media.rotate180)
        .onKeyDown(this, this.onKeyDown) // to log keypresses
        .build()
    );
  }

  changeIndex(change, extendSelect = false) {
    media.moveFocus(change);
    const focusItem = media.getFocus();
    if (focusItem != null) {
      if (extendSelect) {
        media.selectToItem(focusItem);
      } else {
        media.selectItem(focusItem);
      }
    }
  }

  clearSelection() {
    media.clearSelection();
  }

  moveUp(key, target, event) {
    this.changeIndex(-this.layout.getNavigationStepCount(), event.hasShift);
  }
  moveDown(key, target, event) {
    this.changeIndex(this.layout.getNavigationStepCount(), event.hasShift);
  }
  movePrev(key, target, event) {
    this.changeIndex(-1, event.hasShift);
  }
  moveNext(key, target, event) {
    this.changeIndex(1, event.hasShift);
  }

  moveStart(key, target, event) {
    this.changeIndex(-media.getFocusIndex(), event.hasShift);
  }
  moveEnd(key, target, event) {
    this.changeIndex(
      media.getVisibleItems().getLength() - media.getFocusIndex(),
      event.hasShift
    );
  }

  detach() {
    this.listeners.removeAll();
  }

  onKeyDown(key, target, event) {
    log.debug('key down ', key);
  }
}

export { Navigation };
