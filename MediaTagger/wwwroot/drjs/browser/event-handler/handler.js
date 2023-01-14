import { LOG_LEVEL, Logger } from "../../logger.js";
import Util from "../../util.js";
import { DOM, default as dom } from "../dom.js";
import {
  ObjectEventType,
  EventHandlerReturn,
  HandlerMethod,
} from "./common.js";
export * from "./common.js";

const log = Logger.create("EventHandler", LOG_LEVEL.WARN);

export class EventHandlerBuilder {
  constructor(eventHandlerClass) {
    this.handlerClass = eventHandlerClass;
    this.handlerInstance = new this.handlerClass();
  }

  listenTo(element, selector = null) {
    if (element instanceof DOM) {
      this.handlerInstance.listenElement = element.getRoot();
    } else {
      this.handlerInstance.listenElement = element;
    }
    if (selector != null) {
      this.handlerInstance.setSelector(selector);
    }
    return this;
  }
  filterAllow(filterFunction) {
    this.handlerInstance.setFilterAllow(filterFunction    );
    return this;
  }
  capture(shouldCapture = true) {
    this.handlerInstance.Capture = shouldCapture;
    return this;
  }
  handler(...args) {
    this.handlerInstance.handlerMethod = HandlerMethod.Of(...args);
    return this;
  }

  setDefaultResponse(response) {
    this.handlerInstance.setDefaultResponse(response);
    return this;
  }
  withShift(require) {
    this.handlerInstance.setWithShift(require);
    return this;
  }
  withAlt(require) {
    this.handlerInstance.setWithAlt(require);
    return this;
  }
  withCtrl(require) {
    this.handlerInstance.setWithCtrl(require);
    return this;
  }
  setData(data) {
    this.handlerInstance.setData(data);
    return this;
  }

  setTypeName(typeName) {
    this.handlerInstance.setTypeName(typeName);
    return this;
  }
  selector(sel) {
    this.handlerInstance.setSelector(sel);
    return this;
  }
  exclude(sel) {
    this.handlerInstance.exclude(sel);
    return this;
  }

  // default debouncer is 250msecs
  debounce() {
    this.setDebounceMSecs(250);
    return this;
  }
  setDebounceMSecs(msecs = 250) {
    this.handlerInstance.setDebounceMSecs(msecs);
    return this;
  }
  build() {
    this.handlerInstance.listen();
    return this.handlerInstance;
  }
}

export class EventHandler {
  constructor(...args) {
    this.defaultResponse = EventHandlerReturn.Continue;
    this.eventProcessor = this.eventProcessorMethod.bind(this);
    this.listenElement = null;
    this.typeName = null;
    this.selector = null;
    this.excludeSelector = null;
    this.data = null;
    this.dataSource = null;
    this.debounceMSecs = 0;
    this.debounceTimer = null;
    this.withShift = null;
    this.withCtrl = null;
    this.withAlt = null;
    this.handlerMethod = HandlerMethod.None();
    this.capture = null;
    this.filterFunction = null;

    if (args.length == 0) {
      return;
    }
    if (args.length == 1 && typeof args[0] == "string") {
      this.setTypeName(args[0]);
      return;
    }

    var handlerObj = null;
    var handlerFunc = null;
    args.forEach((arg) => {
      if (arg instanceof HTMLElement) {
        this.setListenElement(arg);
      } else if (arg instanceof ObjectEventType) {
        this.setTypeName(arg.name);
      } else if (typeof arg === "object") {
        handlerObj = arg;
      } else if (typeof arg === "function") {
        handlerFunc = arg;
      } else if (typeof arg === "string") {
        if (this.typeName == null) {
          this.setTypeName(arg);
        } else if (this.selector == null) {
          this.setSelector(arg);
        }
      }
    });
    this.handlerMethod = new HandlerMethod(handlerObj, handlerFunc);
  }

  setFilterAllow(func) {
    this.filterFunction = func;
  }

  set Capture(shouldCapture) {
    this.capture = true;
  }

  setWithAlt(require) {
    this.withAlt = require;
  }
  setWithShift(require) {
    this.withShift = require;
  }
  setWithCtrl(require) {
    this.withCtrl = require;
  }

  setListenElement(element) {
    this.listenElement = element;
    return this;
  }

  setHandler(obj, method) {
    if (obj instanceof HandlerMethod) {
      this.handlerMethod = obj;
    } else {
      this.handlerMethod = new HandlerMethod(obj, method);
    }
    return this;
  }

  setTypeName(typeName) {
    this.typeName = typeName;
    return this;
  }
  setSelector(sel) {
    this.selector = sel;
    return this;
  }

  setData(data) {
    this.dataSource = data;
    return this;
  }

  setDefaultResponse(response) {
    this.defaultResponse = response;
  }

  setDebounceMSecs(msecs) {
    this.debounceMSecs = msecs;
  }

  getEventType() {
    return this.typeName;
  }

  isPassive() {
    return false;
  }

  isCapture() {
    return this.capture;
  }
  listen() {
    if (this.listenElement == null) {
      this.listenElement = document.body;
    }
    if (this.typeName == null) {
      log.error("EventHandler requires an event type name (e.g. 'click'");
      return;
    }
    this.typeNames = Util.toArray(this.getEventType());

    const options = {
      passive: this.isPassive(),
      capture: this.isCapture(),
    };
    this.typeNames.forEach((typeName) => {
      if (this.listenElement != null) {
        dom.addListener(
          this.listenElement,
          typeName,
          this.eventProcessor,
          options
        );
      } else if (this.selector != null) {
        this.listenElement = dom.find(this.selector);
        dom.addListener(
          this.listenElement,
          typeName,
          this.eventProcessor,
          options
        );
      } else {
        log.error("EventHandler needs an element or selector");
      }
    });
    return this;
  }

  remove() {
    if (this.listenElement) {
      this.typeNames.forEach((typeName) => {
        dom.removeListener(this.listenElement, typeName, this.eventProcessor, {
          passive: this.isPassive,
          capture: this.capture,
        });
      });
    }
    this.listenElement = null;
    return this;
  }

  getEventTarget(event) {
    if (this.selector == null) {
      return event.currentTarget;
    }
    if (event.target == null) {
      return null;
    }
    if (event.target.matches(this.selector)) {
      return event.target;
    }
    return dom.closest(event.target, this.selector);
  }

  selectorMismatch(event) {
    return (
      this.selector != null && !dom.isElementIn(event.target, this.selector)
    );
  }

  eventProcessorMethod(event) {
    var target = event.target;
    log.never(`eventHandler ${target.id}:${target.className} - ${event.type}`);

    if (this.selectorMismatch(event)) {
      return;
    }
    if (
      this.excludeSelector != null &&
      event.target.matches(this.excludeSelector)
    ) {
      return;
    }
    if (this.withAlt && !event.altKey) {
      return;
    }
    if (this.withCtrl && !event.ctrlKey) {
      return;
    }
    if (this.withShift && !event.shiftKey) {
      return;
    }
    if (this.filterFunction && !this.filterFunction(event)) {
      return;
    }
    event.hasShift = event.shiftKey;
    event.hasAlt = event.altKey;
    event.hasCtrl = event.ctrlKey;
    if (this.debounceMSecs > 0) {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
      this.debounceTimer = setTimeout(() => {
        this.invokeHandler(event);
        this.debounceTimer = null;
      }, this.debounceMSecs);
    } else {
      this.invokeHandler(event);
    }
    log.never(
      `done eventHandler ${target.id}:${target.className} - ${event.type}`
    );
  }

  invokeHandler(event) {
    var result = this.defaultResponse.clone();
    var target = this.getEventTarget(event);
    if (this.dataSource) {
      if (typeof this.dataSource == "function") {
        this.data = this.dataSource(this.getEventTarget(event));
      } else {
        this.data = this.dataSource;
      }
    }
    result.replace(this.callHandler(this.handlerMethod, event));
    result.finishEvent(event);
  }

  // allow derived classed to just override this.
  // they can change values or parse the event and pass additional args
  callHandler(method, event) {
    try {
      if (method != null) {
        method.call(event, this.data);
      }
    } catch (ex) {
      log.error(ex, "event handler for ", this.typeName, " failed");
    }
  }

  exclude(selector) {
    this.excludeSelector = selector;
    return this;
  }
}

export default { EventHandlerBuilder, EventHandler };
