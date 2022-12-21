import { LOG_LEVEL, Logger } from "../../logger.js";
import { EventHandlerBuilder, EventHandler } from "./handler.js";
import { HandlerResponse, MousePosition, HandlerMethod } from "./common.js";
const log = Logger.create("HoverHandler", LOG_LEVEL.WARN);

export function BuildHoverHandler() {
  return new HoverHandlerBuilder();
}

export class HoverHandlerBuilder extends EventHandlerBuilder {
  constructor() {
    super(HoverHandler);
  }

  onStart(...args) {
    this.handlerInstance.onStartHanler = HandlerMethod.Of(...args);
    return this;
  }
  onEnd(...args) {
    this.handlerInstance.onEndHandler = HandlerMethod.Of(...args);
    return this;
  }
  startDelayMSecs(msecs) {
    this.handlerInstance.startDelayMSecs = msecs;
    return this;
  }
  endDelayMSecs(msecs) {
    this.handlerInstance.endDelayMSecs = msecs;
    return this;
  }
}

export class HoverHandler extends EventHandler {
  constructor(...args) {
    super(...args);
    this.setTypeName(["mousemove"]);
    this.setDefaultResponse = HandlerResponse.Continue;
    this.startDelayMSecs = 200;
    this.endDelayMSecs = 200;
    this.onStart = null;
    this.onEnd = null;
    this.mousePosition = new MousePosition();
  }

  callHandler(method, event) {
    this.mousePosition.update(event);
    try {
      if (event.type == "hover") {
      } else if (event.type == "mouseout") {
        this.resetEndTimeout(event);
      }
    } catch (ex) {
      log.error(ex, "event handler for ", this.typeName, " failed");
    }
  }
}

export default {
  BuildHoverHandler,
  HoverHandlerBuilder,
  HoverHandler,
};
