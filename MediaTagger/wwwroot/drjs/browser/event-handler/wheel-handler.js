import { LOG_LEVEL, Logger } from "../../logger.js";
import { default as dom } from "../dom.js";
import {
  EventHandlerBuilder,
  EventHandler,
  EventHandlerReturn,
  HandlerMethod,
} from "./handler.js";

const log = Logger.create("WheelHandler", LOG_LEVEL.WARN);

export function BuildWheelHandler() {
  return new WheelHandlerBuilder();
}

export class WheelHandlerBuilder extends EventHandlerBuilder {
  constructor() {
    super(WheelHandler);
  }

  onChange(...args) {
    this.handlerInstance.setOnChange(new HandlerMethod(...args));
    return this;
  }
}

export class WheelHandler extends EventHandler {
  constructor(...args) {
    super(...args);
    this.setTypeName("wheel");
    // passive handlers can't stop default
    this.setDefaultResponse(EventHandlerReturn.Continue);
    this.setListenElement(dom.getBody());

    this.onChange = HandlerMethod.None;
  }

  isPassive() {
    return true;
  }

  setOnChange(handler) {
    this.onChange = handler;
  }

  callHandler(method, event) {
    try {
      log.debug("wheel event ", event.wheelDelta);
      var response = EventHandlerReturn.Continue;
      if (method) {
        response.replace(
          method.call(event.currentTarget, this.data, event, this)
        );
      }
      response.replace(
        this.onChange.call(event.wheelDelta, event.target, event, this)
      );
      return response;
    } catch (ex) {
      log.error(ex, "event handler for ", this.typeName, " failed");
    }
  }
}

export default { BuildWheelHandler, WheelHandlerBuilder, WheelHandler };
