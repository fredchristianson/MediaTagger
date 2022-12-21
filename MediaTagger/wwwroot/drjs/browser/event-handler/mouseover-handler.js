import { LOG_LEVEL, Logger } from "../../logger.js";
import Util from "../../util.js";
import { default as dom } from "../dom.js";
import { EventHandlerBuilder, EventHandler } from "./handler.js";
import {
  HandlerResponse,
  MousePosition,
  HandlerMethod,
  DoNothing,
} from "./common.js";
const log = Logger.create("MouseOverHandler", LOG_LEVEL.WARN);

export function BuildMouseOverHandler() {
  return new MouseOverHandlerBuilder();
}

export class MouseOverHandlerBuilder extends EventHandlerBuilder {
  constructor() {
    super(MouseOverHandler);
  }

  onOver(...args) {
    this.handlerInstance.setOnOver(new HandlerMethod(...args));
    return this;
  }
  onOut(...args) {
    this.handlerInstance.setOnOut(new HandlerMethod(...args));
    return this;
  }
  disableContextMenu(disabled = true) {
    this.handlerInstance.disableContextMenu = disabled;
    return this;
  }
}

export class MouseOverHandler extends EventHandler {
  constructor(...args) {
    super(...args);
    this.setTypeName(["mouseover", "mouseout"]);
    this.setDefaultResponse = HandlerResponse.Continue;
    this.endDelayMSecs = 200;
    this.onOver = HandlerMethod.None();
    this.onOut = HandlerMethod.None();
    this.mousePosition = new MousePosition();
    this.disableContextMenu = false;
  }
  setOnOver(handler) {
    this.onOver = handler;
  }
  setOnOut(handler) {
    this.onOut = handler;
  }

  callHandler(method, event) {
    this.mousePosition.update(event);
    try {
      if (event.type == "mouseover") {
        if (this.disableContextMenu) {
          document.body.oncontextmenu = () => {
            return false;
          };
        }
        this.onOver.call(
          this.mousePosition,
          this.getEventTarget(event),
          event,
          this.data,
          this
        );
      } else if (event.type == "mouseout") {
        this.onOut.call(
          this.mousePosition,
          this.getEventTarget(event),
          event,
          this.data,
          this
        );
        if (this.disableContextMenu) {
          document.body.oncontextmenu = null;
        }
      }
    } catch (ex) {
      log.error(ex, "event handler for ", this.typeName, " failed");
    }
  }
}

export default {
  BuildMouseOverHandler,
  MouseOverHandlerBuilder,
  MouseOverHandler,
};
