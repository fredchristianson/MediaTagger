import { LOG_LEVEL, Logger } from "../../logger.js";
import { default as dom } from "../dom.js";
import {
  EventHandlerBuilder,
  EventHandler,
  HandlerMethod,
  DoNothing,
  EventHandlerReturn,
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
    this.handlerInstance.setOnClick(new HandlerMethod(...args));
    return this;
  }
  onLeftClick(...args) {
    this.handlerInstance.setOnLeftClick(new HandlerMethod(...args));
    return this;
  }
  onRightClick(...args) {
    this.handlerInstance.setOnRightClick(new HandlerMethod(...args));
    return this;
  }
  onMiddleClick(...args) {
    this.handlerInstance.setOnMiddleClick(new HandlerMethod(...args));
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

    this.onClick = HandlerMethod.None();
    this.onLeftClick = HandlerMethod.None();
    this.onRightClick = HandlerMethod.None();
    this.onMiddleClick = HandlerMethod.None();
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

  callHandler(method, event) {
    try {
      var response = this.defaultResponse.clone();

      if (event.type == "mouseover") {
        if (this.onRightClick) {
          document.oncontextmenu = DoNothing;
        }
        return;
      } else if (event.type == "mouseout") {
        if (this.onRightClick) {
          document.oncontextmenu = null;
        }
        return;
      }
      if (event.type == "mousedown") {
        if (event.button == 1 && this.onMiddleClick) {
          response.preventDefault = true;
          event.preventDefault(); // don't scroll if middle click handler exists
        }
      }
      if (method != null) {
        response.combine(
          method.call(event.currentTarget, this.data, event, this)
        );
      }
      if (event.type == "click" && this.onClick != null) {
        this.onClick.setData(this.dataSource, this.data);
        response.combine(
          this.onClick.call(this.getEventTarget(event), this.data, event, this)
        );
      }
      if (event.type == "mouseup") {
        if (event.button == 0) {
          response.combine(
            this.onLeftClick.call(
              this.getEventTarget(event),
              this.data,
              this.onLeftClick,
              "onLeftClick"
            )
          );
        }
        if (event.button == 1) {
          response.combine(
            this.onMiddleClick.call(
              this.getEventTarget(event),
              this.data,
              this.onMiddleClick,
              "onMiddleClick"
            )
          );
        }
        if (event.button == 2) {
          response.combine(
            this.onRightClick.call(
              this.getEventTarget(event),
              this.data,
              this.onRightClick,
              "onRightClick"
            )
          );
        }
      }
      return response;
    } catch (ex) {
      log.error(ex, "event handler for ", this.typeName, " failed");
    }
  }
}

export default { BuildClickHandler, ClickHandlerBuilder, ClickHandler };
