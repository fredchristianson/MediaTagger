import { LOG_LEVEL, Logger } from "../../logger.js";
import { default as dom } from "../dom.js";
import { EventHandlerBuilder, EventHandler } from "./handler.js";
import { HandlerMethod } from "./common.js";
const log = Logger.create("ScrollHandler", LOG_LEVEL.WARN);

export function BuildScrollHandler() {
  return new ScrollHandlerBuilder(ScrollHandler);
}

export class ScrollHandlerBuilder extends EventHandlerBuilder {
  constructor(type = null) {
    super(type || ScrollHandler);
  }

  onScroll(...args) {
    this.handler.setOnScroll(new HandlerMethod(...args));
    return this;
  }
}

export class ScrollHandler extends EventHandler {
  constructor(...args) {
    super("scroll", ...args);
    this.onScroll = null;
  }

  setOnScroll(handler) {
    this.onScroll = handler;
  }

  callHandler(method, event) {
    try {
      if (method != null) {
        method(event.currentTarget, this.data, event, this);
      }
      if (this.onScroll != null) {
        var scrollMethod = this.onScroll.getMethod({ defaultName: "onScroll" });
        if (scrollMethod) {
          scrollMethod(
            event.currentTarget.scrollTop,
            event.currentTarget,
            this.data,
            event,
            this
          );
        }
      }
    } catch (ex) {
      log.error(ex, "event handler for ", this.typeName, " failed");
    }
  }
}

export default { BuildScrollHandler, ScrollHandlerBuilder, ScrollHandler };
