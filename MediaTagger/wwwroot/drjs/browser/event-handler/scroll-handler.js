import { LOG_LEVEL, Logger } from "../../logger.js";
import { default as dom } from "../dom.js";
import { EventHandlerBuilder, EventHandler } from "./handler.js";
import { HandlerMethod, HandlerResponse } from "./common.js";
const log = Logger.create("ScrollHandler", LOG_LEVEL.WARN);

export function BuildScrollHandler() {
  return new ScrollHandlerBuilder(ScrollHandler);
}

export class ScrollHandlerBuilder extends EventHandlerBuilder {
  constructor(type = null) {
    super(type || ScrollHandler);
  }

  onScroll(...args) {
    this.handlerInstance.setOnScroll(new HandlerMethod(...args, "onScroll"));
    return this;
  }
}

export class ScrollHandler extends EventHandler {
  constructor(...args) {
    super("scroll", ...args);
    this.defaultResponse = HandlerResponse.Continue;
    this.onScroll = HandlerMethod.None();
  }

  isPassive() {
    return true;
  }

  setOnScroll(handler) {
    this.onScroll = handler;
  }

  callHandler(method, event) {
    try {
      if (method != null) {
        method.call(event.currentTarget, this.data, event, this);
      }
      if (this.onScroll != null) {
        this.onScroll.call(
          event.currentTarget.scrollTop,
          event.currentTarget,
          this.data,
          event,
          this
        );
      }
    } catch (ex) {
      log.error(ex, "event handler for ", this.typeName, " failed");
    }
  }
}

export default { BuildScrollHandler, ScrollHandlerBuilder, ScrollHandler };
