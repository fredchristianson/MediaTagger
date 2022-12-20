import { LOG_LEVEL, Logger } from "../../logger.js";
import Util from "../../util.js";
import { default as dom } from "../dom.js";
import { EventHandlerBuilder, EventHandler } from "./handler.js";
import { HandlerResponse, MousePosition, HandlerMethod } from "./common.js";
const log = Logger.create("MouseOverHandler", LOG_LEVEL.WARN);

export function BuildMouseOverHandler() {
  return new MouseOverHandlerBuilder();
}

export class MouseOverHandlerBuilder extends EventHandlerBuilder {
  constructor() {
    super(MouseOverHandler);
  }

  onStart(...args) {
    this.handler.setOnStart(new HandlerMethod(...args));
    return this;
  }
  onEnd(...args) {
    this.handler.setOnEnd(new HandlerMethod(...args));
    return this;
  }
  onMouseMove(...args) {
    this.handler.setOnMouseMove(new HandlerMethod(...args));
    return this;
  }
  include(selectors) {
    this.handler.setInclude(selectors);
    return this;
  }
  endDelayMSecs(msecs = 300) {
    this.handler.setEndDelayMSecs(msecs);
    return this;
  }
  disableContextMenu() {
    this.handler.setDisableContextMenu(true);
    return this;
  }
}

export class MouseOverHandler extends EventHandler {
  constructor(...args) {
    super(...args);
    this.setTypeName(["mouseover", "mouseout", "mousemove"]);
    this.setDefaultResponse = HandlerResponse.Continue;
    this.endDelayMSecs = 200;
    this.includeSelectors = [];
    this.onStartHandler = null;
    this.onEndHandler = null;
    this.onMoveHandler = null;
    this.mouseMoveBodyHandler = this.onMouseMoveBody.bind(this);
    this.endTimeout = null;
    this.inMouseOver = false;
    this.disableContextMenuOnMouseOver = false;
    this.originalConextMenu = document.oncontextmenu;
    this.mousePosition = new MousePosition();
  }
  setOnStart(handler) {
    this.onStartHandler = handler;
  }
  setOnEnd(handler) {
    this.onEndHandler = handler;
  }
  setOnMouseMove(handler) {
    this.onMoveHandler = handler;
  }
  setInclude(selectors) {
    this.includeSelectors = Util.toArray(selectors);
  }
  setEndDelayMSecs(msecs) {
    this.endDelayMSecs = msecs;
  }

  setDisableContextMenu(disabled = true) {
    this.disableContextMenuOnMouseOver = disabled;
  }

  onMouseMoveBody(event) {
    log.info("mousemove ");
    if (dom.isElementIn(event.target, this.includeSelectors)) {
      this.cancelEndTimeout();
    } else if (this.endTimeout == null) {
      this.resetEndTimeout();
    }
  }

  cancelEndTimeout() {
    if (this.endTimeout) {
      clearTimeout(this.endTimeout);
      this.endTimeout = null;
    }
  }

  resetEndTimeout(event) {
    this.cancelEndTimeout();
    this.endTimeout = setTimeout(() => {
      this.endMouseOver();
    }, this.endDelayMSecs);
  }

  startMouseOver(event) {
    if (this.disableContextMenuOnMouseOver) {
      document.oncontextmenu = function () {
        return false;
      };
    }

    this.inMouseOver = true;
    dom.getBody().addEventListener("mousemove", this.mouseMoveBodyHandler);
    if (this.onStartHandler) {
      var method = this.onStartHandler.getMethod("onMouseOverStart");
      if (method) {
        method(this.mousePosition, event, this.data, this);
      }
    }
  }

  endMouseOver(event) {
    this.inMouseOver = false;
    dom.getBody().removeEventListener("mousemove", this.mouseMoveBodyHandler);
    if (this.onEndHandler) {
      var method = this.onEndHandler.getMethod("onMouseOverEnd");

      if (method) {
        method(this.mousePosition, event, this.data, this);
      }
    }
    if (this.disableContextMenuOnMouseOver) {
      document.oncontextmenu = this.originalConextMenu;
    }
  }

  callHandler(method, event) {
    this.mousePosition.update(event);
    try {
      if (event.type == "mouseover") {
        this.cancelEndTimeout();
        // delay may result in a 2nd start before end.  ignore it.
        if (this.inMouseOver) {
          return;
        }
        this.startMouseOver();
      } else if (event.type == "mouseout") {
        this.resetEndTimeout(event);
      } else if (event.type == "mousemove") {
        if (this.onMoveHandler) {
          var method = this.onMoveHandler.getMethod("onMouseMove");
          if (method) {
            method(this.mousePosition, event, this.data, this);
          }
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
