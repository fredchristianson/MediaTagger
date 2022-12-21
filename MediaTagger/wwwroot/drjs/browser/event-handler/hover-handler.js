import { LOG_LEVEL, Logger } from "../../logger.js";
import { EventHandlerBuilder, EventHandler } from "./handler.js";
import { HandlerResponse, MousePosition, HandlerMethod } from "./common.js";
import dom from "../dom.js";
import util from "../../util.js";
import { CancelToken, Task } from "../task.js";
const log = Logger.create("HoverHandler", LOG_LEVEL.debug);

export function BuildHoverHandler() {
  return new HoverHandlerBuilder();
}

export class HoverHandlerBuilder extends EventHandlerBuilder {
  constructor() {
    super(HoverHandler);
  }

  onStart(...args) {
    this.handlerInstance.onStart = HandlerMethod.Of(...args, "onHoverStart");
    return this;
  }
  onEnd(...args) {
    this.handlerInstance.onEnd = HandlerMethod.Of(...args, "onHoverEnd");
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
  include(selectors) {
    this.handlerInstance.includeSelectors = selectors;
    super.selector(
      util
        .toArray(this.handlerInstance.hoverSelectors)
        .concat(util.toArray(this.handlerInstance.includeSelectors))
    );
    return this;
  }
  selector(selectors) {
    this.handlerInstance.hoverSelectors = selectors;
    super.selector(
      util
        .toArray(this.handlerInstance.hoverSelectors)
        .concat(util.toArray(this.handlerInstance.includeSelectors))
    );
    return this;
  }
}

export class HoverHandler extends EventHandler {
  constructor(...args) {
    super(...args);
    this.setTypeName(["mousemove", "mouseout"]);
    this.setDefaultResponse = HandlerResponse.Continue;
    this.startDelayMSecs = 200;
    this.endDelayMSecs = 200;
    this.onStart = HandlerMethod.None();
    this.onEnd = HandlerMethod.None();
    this.includeSelectors = null;
    this.mousePosition = new MousePosition();
    this.inHover = false;
    this.startCancel = new CancelToken();
    this.endCancel = new CancelToken();
    this.currentTarget = null;
  }

  callStart(target, data) {
    if (this.dataSource) {
      this.onStart.call(data, target);
    } else {
      this.onStart.call(target);
    }
  }
  callEnd(target, data) {
    if (this.dataSource) {
      this.onEnd.call(data, target);
    } else {
      this.onEnd.call(target);
    }
  }
  start(event, target, data) {
    if (this.inHover) {
      log.debug("no start - already hovering");
      return;
    }
    this.inHover = true;
    this.currentTarget = target;
    this.currentData = data;
    this.endCancel.cancel();
    this.startCancel.cancel();

    log.debug("start task delayed ", this.startDelayMSecs);
    this.startCancel = Task.Delay(this.startDelayMSecs, () => {
      log.debug("call onStart");
      this.callStart(target, data);
    });
  }

  end(event, target, data) {
    if (!this.inHover) {
      return;
    }

    this.endCancel.cancel();
    this.endCancel = Task.Delay(this.endDelayMSecs, () => {
      this.startCancel.cancel();
      this.inHover = false;
      this.callEnd(target, data);
    });
  }
  callHandler(method, event) {
    this.mousePosition.update(event);
    try {
      var target = this.getEventTarget(event);
      log.debug(`hover: ${target.className} - ${event.type}`);
      if (event.type == "mousemove") {
        if (this.selector == null || dom.matches(target, this.selector)) {
          this.endCancel.cancel();
          if (this.inHover && this.currentTarget == target) {
            return;
          }
          if (this.inHover && this.currentTarget != target) {
            log.debug("force end of old hover");
            this.callEnd(this.currentTarget, this.currentData);
            this.currentTarget = null;
            this.inHover = false;
          }
          log.debug("start hover delay");
          this.start(event, target, this.data);
        } else if (
          this.includeSelectors != null &&
          dom.matches(target, this.includeSelectors)
        ) {
          this.endCancel.cancel();
          log.debug("ignore move - includeSelectors match");
        } else {
          this.end(event);
        }
      } else if (event.type == "mouseout") {
        if (!dom.matches(event.toElement, this.selector)) {
          this.end(event, this.currentTarget, this.currentData);
        } else {
          log.debug("mouse out to included element");
        }
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
