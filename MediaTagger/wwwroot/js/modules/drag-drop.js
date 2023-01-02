import { Listeners, BuildDragDropHandler } from "../../drjs/browser/event.js";
import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import dom from "../../drjs/browser/dom.js";
const log = Logger.create("Draggable", LOG_LEVEL.DEBUG);

export class Dragable {
  constructor(draggable, droppable) {
    this.listeners = new Listeners(
      BuildDragDropHandler(draggable, droppable)
        .dragSelector(draggable)
        .dropSelector(droppable)
        .onStart(this, this.onStart)
        .onEnd(this, this.onEnd)
        .onDrag(this, this.onDrag)
        .onEnter(this, this.onEnter)
        .onOver(this, this.onOver)
        .onLeave(this, this.onLeave)
        .onDrop(this, this.onDrop)

        .build()
    );
  }

  detach() {
    this.listeners.removeAll();
  }

  onStart() {
    log.debug("dragstart");
  }
  onEnd() {
    log.debug("dragEnd");
  }
  onDrag() {
    log.debug("drag");
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

export class GridSizer extends Dragable {
  constructor(sizer, target) {
    super(sizer, dom.first(sizer));
    this.sizer = sizer;
    this.target = target;
  }
}
export class LeftGridSizer extends GridSizer {
  constructor(sizer, target) {
    super(sizer, target);
  }
}
export class RightGridSizer extends GridSizer {
  constructor(sizer, target) {
    super(sizer, target);
  }
}
