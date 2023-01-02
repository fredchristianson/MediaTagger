import {
  Listeners,
  BuildDragHandler,
  BuildDropHandler,
} from "../../drjs/browser/event.js";
import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import dom from "../../drjs/browser/dom.js";
const log = Logger.create("Draggable", LOG_LEVEL.DEBUG);

export class Draggable {
  constructor(draggable) {
    this.listeners = new Listeners(
      BuildDragHandler(draggable)
        .listenTo(draggable)
        .onStart(this, this.onStart)
        .onEnd(this, this.onEnd)
        .onDrag(this, this.onDrag)
        .build()
    );
    this.dropListener = null;
  }

  detach() {
    this.listeners.removeAll();
  }

  getDropTargetSelector() {
    return dom.getBody();
  }
  onStart(element, event) {
    if (this.dropListener != null) {
      log.error("draggable onStart already has a drop listener");
      return;
    }
    this.dropListener = BuildDropHandler()
      .listenTo(this.getDropTargetSelector())
      .onEnter(this, this.onEnter)
      .onLeave(this, this.onLeave)
      .onDrop(this, this.onDrop)
      .onOver(this, this.onOver)
      .build();
    log.debug("dragstart");
    dom.addClass(element, "dragging");

    event.dataTransfer.effectAllowed = "move";
  }
  onEnd(element) {
    if (this.dropListener) {
      this.dropListener.remove();
      this.dropListener = null;
    }
    log.debug("dragEnd");
    dom.removeClass(element, "dragging");
  }
  onDrag() {
    // log.debug("drag");
  }
  onEnter() {
    log.debug("dragEnter");
  }
  onLeave() {
    log.debug("dragLeave");
  }
  onOver() {
    log.debug("dragOver");
  }
  onDrop() {
    log.debug("dragDrop");
  }
}

export class GridSizer extends Draggable {
  constructor(sizer, target) {
    super(sizer);
    this.sizer = sizer;
    this.target = target;
  }
  getDropTargetSelector() {
    return dom.parent(this.sizer);
  }
}
export class LeftGridSizer extends GridSizer {
  constructor(sizer, target) {
    super(sizer, target);
  }
  onOver(target, event) {
    log.debug("dragOver");
    var pwidth = dom.getWidth(target);
    var dragX = event.clientX;
    var width = pwidth - dragX;
    dom.setWidth(this.target, width);
  }
}
export class RightGridSizer extends GridSizer {
  constructor(sizer, target) {
    super(sizer, target);
  }
  onOver(target, event) {
    log.debug("dragOver");
    var pwidth = dom.getWidth(target);
    var dragX = event.clientX;
    var width = pwidth - dragX;
    dom.setWidth(this.target, dragX);
  }
}
