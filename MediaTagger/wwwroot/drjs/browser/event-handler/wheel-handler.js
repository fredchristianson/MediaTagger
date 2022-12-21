import { LOG_LEVEL, Logger } from "../../logger.js";
import { default as dom } from "../dom.js";
import {
  EventHandlerBuilder,
  EventHandler,
  HandlerResponse,
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
    this.setDefaultResponse(HandlerResponse.StopDefault);
    this.setListenElement(dom.getBody());

    this.onChange = null;
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
      if (method) {
        method(event.currentTarget, this.data, event, this);
      }
      if (this.onChange) {
        var changeMethod = this.onChange.getMethod({
          defaultName: "onChange",
        });
        if (changeMethod) {
          changeMethod(event.wheelDelta, event.target, event, this);
        }
      }
    } catch (ex) {
      log.error(ex, "event handler for ", this.typeName, " failed");
    }
  }
}

export default { BuildWheelHandler, WheelHandlerBuilder, WheelHandler };
