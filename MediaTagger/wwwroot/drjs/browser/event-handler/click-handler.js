import { LOG_LEVEL, Logger } from "../../logger.js";
import { default as dom } from "../dom.js";
import {
  EventHandlerBuilder,
  EventHandler,
  HandlerMethod,
  DoNothing,
} from "./handler.js";

const log = Logger.create("ClickHandler", LOG_LEVEL.WARN);

export function BuildClickHandler() {
  return new ClickHandlerBuilder(ClickHandler);
}

export class ClickHandlerBuilder extends EventHandlerBuilder {
  constructor(type = null) {
    super(type || ClickHandler);
  }

  onClick(...args) {
    this.handler.setOnClick(new HandlerMethod(...args));
    return this;
  }
  onLeftClick(...args) {
    this.handler.setOnLeftClick(new HandlerMethod(...args));
    return this;
  }
  onRightClick(...args) {
    this.handler.setOnRightClick(new HandlerMethod(...args));
    return this;
  }
  onMiddleClick(...args) {
    this.handler.setOnMiddleClick(new HandlerMethod(...args));
    return this;
  }
}

export class ClickHandler extends EventHandler {
  constructor(...args) {
    super(...args);
    this.setTypeName([
      "click",
      "mouseup",
      "mousedown",
      "mouseover",
      "mouseout",
    ]);
    this.onClick = null;
    this.onLeftClick = null;
    this.onRightClick = null;
    this.onMiddleClick = null;
  }

  setOnClick(handler) {
    this.onClick = handler;
  }
  setOnLeftClick(handler) {
    this.onLeftClick = handler;
  }
  setOnRightClick(handler) {
    this.onRightClick = handler;
  }
  setOnMiddleClick(handler) {
    this.onMiddleClick = handler;
  }

  callIf(event, method, defaultName) {
    if (method != null) {
      var func = method.getMethod(defaultName);
      if (func) {
        func(this.getEventTarget(event), this.data, event, this);
        return true;
      }
    }
    return false;
  }
  callHandler(method, event) {
    try {
      if (event.type == "mouseover") {
        if (this.onRightClick) {
          this.oldOnContextMenu = document.oncontextmenu;
          document.oncontextmenu = DoNothing;
        }
        return;
      } else if (event.type == "mouseout") {
        if (this.onRightClick) {
          document.oncontextmenu = this.oldOnContextMenu;
        }
        return;
      }
      if (event.type == "mousedown") {
        if (event.button == 1 && this.onMiddleClick) {
          event.preventDefault(); // don't scroll if middle click handler exists
        }
      }
      if (method != null) {
        method(event.currentTarget, this.data, event, this);
      }
      if (event.type == "click" && this.onClick != null) {
        var clickMethod = this.onClick.getMethod({ defaultName: "onClick" });
        if (clickMethod) {
          clickMethod(this.getEventTarget(event), this.data, event, this);
        }
      }
      if (event.type == "mouseup") {
        if (event.button == 0) {
          this.callIf(event, this.onLeftClick, "onLeftClick");
        }
        if (event.button == 1) {
          this.callIf(event, this.onMiddleClick, "onMiddleClick");
        }
        if (event.button == 2) {
          if (this.callIf(event, this.onRightClick, "onRightClick")) {
            document.oncontextmenu = DoNothing;
            setTimeout(() => {
              document.oncontextmenu = null;
            }, 100);
          }
        }
      }
    } catch (ex) {
      log.error(ex, "event handler for ", this.typeName, " failed");
    }
  }
}

export default { BuildClickHandler, ClickHandlerBuilder, ClickHandler };
