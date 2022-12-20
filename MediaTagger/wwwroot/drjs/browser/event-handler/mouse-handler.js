import { LOG_LEVEL, Logger } from "../../logger.js";
import { default as dom } from "../dom.js";
import {
  EventHandlerBuilder,
  EventHandler,
  MousePosition,
  HandlerMethod,
} from "./handler.js";

const log = Logger.create("MouseHandler", LOG_LEVEL.WARN);

export function BuildMouseHandler() {
  return new MouseHandlerBuilder();
}

export class MouseHandlerBuilder extends EventHandlerBuilder {
  constructor() {
    super(MouseHandler);
  }
  onLeftDown(...args) {
    this.handler.setOnLeftDown(new HandlerMethod(...args));
    return this;
  }

  onLeftUp(...args) {
    this.handler.setOnLeftUp(new HandlerMethod(...args));
    return this;
  }
  onRightDown(...args) {
    this.handler.setOnRightDown(new HandlerMethod(...args));
    return this;
  }

  onRightUp(...args) {
    this.handler.setOnRightUp(new HandlerMethod(...args));
    return this;
  }
  onMouseMove(...args) {
    this.handler.setOnMouseMove(new HandlerMethod(...args));
    return this;
  }
}

export class MouseHandler extends EventHandler {
  constructor(...args) {
    super(...args);
    this.setTypeName(["mousedown", "mouseup", "mousemove"]);
    this.endDelayMSecs = 200;
    this.onLeftDown = null;
    this.onLeftUp = null;
    this.onRightDown = null;
    this.onRightUp = null;
    this.onMouseMove = null;
    this.mousePosition = new MousePosition();
  }

  getEventType() {
    return this.typeName;
  }

  setOnLeftDown(handler) {
    this.onLeftDown = handler;
  }

  setOnLeftUp(handler) {
    this.onLeftUp = handler;
  }
  setOnRightDown(handler) {
    this.onRightDown = handler;
  }

  setOnRightUp(handler) {
    this.onRightUp = handler;
  }
  setOnMouseMove(handler) {
    this.onMouseMove = handler;
  }

  callIfSet(event, handler, name) {
    if (handler) {
      var method = handler.getMethod(name);
      method(this.mousePosition, event, this.data, this);
    }
  }

  callHandler(method, event) {
    this.mousePosition.update(event);
    try {
      if (event.type == "mousemove") {
        var moveMethod = this.onMouseMove.getMethod("onMouseMove");

        if (moveMethod) {
          moveMethod(this.mousePosition, event, this.data, this);
        }
      } else if (event.type == "mousedown") {
        if (event.button == 0) {
          this.callIfSet(event, this.onLeftDown, "onLeftDown");
        } else if (event.button == 2) {
          this.callIfSet(event, this.onRightDown, "onRightDown");
        } else {
          log.error("unknown button ", event.button);
        }
      } else if (event.type == "mouseup") {
        if (event.button == 0) {
          this.callIfSet(event, this.onLeftUp, "onLeftUp");
        } else if (event.button == 2) {
          this.callIfSet(event, this.onRightUp, "onRightUp");
        } else {
          log.error("unknown button ", event.button);
        }
      }
    } catch (ex) {
      log.error(ex, "event handler for ", this.typeName, " failed");
    }
  }
}

export default { BuildMouseHandler, MouseHandlerBuilder, MouseHandler };
