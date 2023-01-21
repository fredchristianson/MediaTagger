import { LOG_LEVEL, Logger } from "../../logger.js";
import { EventHandlerBuilder, EventListener } from "./handler.js";
import { Continuation, MousePosition, HandlerMethod } from "./common.js";
import dom from "../dom.js";
import util from "../../util.js";
import { CancelToken, Task } from "../task.js";
const log = Logger.create("DragHandler", LOG_LEVEL.WARN);

export class DragHandlerBuilder extends EventHandlerBuilder {
  constructor() {
    super(DragHandler);
  }

  onStart(...args) {
    this.handlerInstance.onStart = HandlerMethod.Of(...args, "onDragStart");
    return this;
  }
  onEnd(...args) {
    this.handlerInstance.onEnd = HandlerMethod.Of(...args, "onDragEnd");
    return this;
  }
  onDrag(...args) {
    this.handlerInstance.onDrag = HandlerMethod.Of(...args, "onDragDrag");
    return this;
  }
}

export class DropHandlerBuilder extends EventHandlerBuilder {
  constructor() {
    super(DropHandler);
  }

  onEnter(...args) {
    this.handlerInstance.onEnter = HandlerMethod.Of(...args, "onDragEnter");
    return this;
  }
  onOver(...args) {
    this.handlerInstance.onOver = HandlerMethod.Of(...args, "onDragOver");
    return this;
  }
  onLeave(...args) {
    this.handlerInstance.onLeave = HandlerMethod.Of(...args, "onDragLeave");
    return this;
  }
  onDrop(...args) {
    this.handlerInstance.onDrop = HandlerMethod.Of(...args, "onDragDrop");
    return this;
  }
}

export class DragHandler extends EventListener {
  constructor(...args) {
    super(...args);
    this.setTypeName(["dragstart", "drag", "dragend"]);
    this.setDefaultContinuation(Continuation.Continue);

    this.onStart = HandlerMethod.None();
    this.onEnd = HandlerMethod.None();
    this.onDrag = HandlerMethod.None();
  }

  callHandlers(event) {
    try {
      var response = Continuation.Continue;
      var target = this.getEventTarget(event);
      log.debug(`Drag: ${target.className} - ${event.type}`);
      if (event.type == "dragstart") {
        log.debug("drag: ", event.type);
        response.combine(this.onStart.call(this, event));
      } else if (event.type == "drag") {
        log.debug("drag: ", event.type);
        response.combine(this.onDrag.call(this, event));
      } else if (event.type == "dragend") {
        log.debug("drag: ", event.type);
        response.combine(this.onEnd.call(this, event));
      }
      return response;
    } catch (ex) {
      log.error(ex, "event handler for ", this.typeName, " failed");
    }
  }
}

export class DropHandler extends EventListener {
  constructor(...args) {
    super(...args);
    this.setTypeName(["dragenter", "dragover", "dragleave", "drop"]);
    this.setDefaultContinuation(Continuation.PreventDefault);

    this.onEnter = HandlerMethod.None();
    this.onOver = HandlerMethod.None();
    this.onLeave = HandlerMethod.None();
    this.onDrop = HandlerMethod.None();
    this.mousePosition = new MousePosition();
  }

  callHandlers(event) {
    try {
      var target = this.getEventTarget(event);
      log.debug(`Drag: ${target.className} - ${event.type}`);
      var response = Continuation.PreventDefault;
      if (event.type == "dragenter") {
        log.debug("drag: ", event.type);
        response.combine(this.onEnter.call(this, event));
      } else if (event.type == "dragover") {
        response.combine(this.onOver.call(this, event));
        log.debug("drag: ", event.type);
      } else if (event.type == "dragleave") {
        response.combine(this.onLeave.call(this, event));
        log.debug("drag: ", event.type);
      } else if (event.type == "drop") {
        response.combine(this.onDrop.call(this, event));
        log.debug("drag: ", event.type);
      }
      return response;
    } catch (ex) {
      log.error(ex, "event handler for ", this.typeName, " failed");
    }
  }
}

export default {
  DragHandlerBuilder,
  DropHandlerBuilder,
  DragHandler,
  DropHandler,
};
