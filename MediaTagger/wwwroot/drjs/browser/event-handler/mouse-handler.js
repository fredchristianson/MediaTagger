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
    this.handlerInstance.setOnLeftDown(new HandlerMethod(...args));
    return this;
  }

  onLeftUp(...args) {
    this.handlerInstance.setOnLeftUp(new HandlerMethod(...args));
    return this;
  }
  onRightDown(...args) {
    this.handlerInstance.setOnRightDown(new HandlerMethod(...args));
    return this;
  }

  onRightUp(...args) {
    this.handlerInstance.setOnRightUp(new HandlerMethod(...args));
    return this;
  }
  onMiddleDown(...args) {
    this.handlerInstance.setOnMiddleDown(new HandlerMethod(...args));
    return this;
  }

  onMiddleUp(...args) {
    this.handlerInstance.setOnMiddleUp(new HandlerMethod(...args));
    return this;
  }
  onMouseMove(...args) {
    this.handlerInstance.setOnMouseMove(
      new HandlerMethod(...args, "onMouseMove")
    );
    return this;
  }
}

export class MouseHandler extends EventHandler {
  constructor(...args) {
    super(...args);
    this.setTypeName(["mousedown", "mouseup", "mousemove"]);
    this.endDelayMSecs = 200;
    this.onLeftDown = HandlerMethod.None();
    this.onLeftUp = HandlerMethod.None();
    this.onRightDown = HandlerMethod.None();
    this.onRightUp = HandlerMethod.None();
    this.onMiddleDown = HandlerMethod.None();
    this.onMiddleUp = HandlerMethod.None();
    this.onMouseMove = HandlerMethod.None();
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
  setOnMiddleDown(handler) {
    this.onMiddleDown = handler;
  }

  setOnMiddleUp(handler) {
    this.onMiddleUp = handler;
  }
  setOnMouseMove(handler) {
    this.onMouseMove = handler;
  }

  callHandler(method, event) {
    this.mousePosition.update(event);
    var target = this.getEventTarget(event);
    log.never(`mouse ${target.id}:${target.className} - ${event.type}`);

    try {
      if (event.type == "mousemove") {
        this.onMouseMove.call(
          this.mousePosition,
          this.getEventTarget(event),
          event,
          this.data,
          this
        );
      } else if (event.type == "mousedown") {
        if (event.button >= 0 && event.button <= 2) {
          [this.onLeftDown, this.onMiddleDown, this.onRightDown][
            event.button
          ].call(
            this.mousePosition,
            this.getEventTarget(event),
            event,
            this.data,
            this
          );
        } else {
          log.error("unknown button ", event.button);
        }
      } else if (event.type == "mouseup") {
        if (event.button >= 0 && event.button <= 2) {
          [this.onLeftUp, this.onMiddleUp, this.onRightUp][event.button].call(
            this.mousePosition,
            this.getEventTarget(event),
            event,
            this.data,
            this
          );
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
