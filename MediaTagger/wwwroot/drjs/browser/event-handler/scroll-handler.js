import { LOG_LEVEL, Logger } from "../../logger.js";
import { default as dom } from "../dom.js";
import { EventHandlerBuilder, EventListener } from "./handler.js";
import { HandlerMethod, Continuation } from "./common.js";
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

export class ScrollHandler extends EventListener {
  constructor() {
    super();
    this.defaultResponse = Continuation.Continue;
    this.onScroll = HandlerMethod.None();
  }
  getEventType() {
    return ["scroll"];
  }

  isPassive() {
    return true;
  }

  setOnScroll(handler) {
    this.onScroll = handler;
  }

  callHandlers(event) {
    try {
      var response = Continuation.Continue;
      if (this.onScroll != null) {
        response.replace(this.onScroll.call(this, event));
      }
    } catch (ex) {
      log.error(ex, "event handler for ", this.typeName, " failed");
    }
  }
}

export default { BuildScrollHandler, ScrollHandlerBuilder, ScrollHandler };
