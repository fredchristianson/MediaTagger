import { LOG_LEVEL, Logger } from "../../logger.js";
import Util from "../../util.js";
import { DOM, default as dom } from "../dom.js";
import { ObjectEventType, HandlerResponse, HandlerMethod } from "./common.js";
export * from "./common.js";

const log = Logger.create("EventHandler", LOG_LEVEL.WARN);

export class EventHandlerBuilder {
  constructor(eventHandlerClass) {
    this.handlerClass = eventHandlerClass;
    this.handler = new this.handlerClass();
  }

  listenTo(element, selector = null) {
    if (element instanceof DOM) {
      this.handler.listenElement = element.getRoot();
    } else {
      this.handler.listenElement = element;
    }
    if (selector != null) {
      this.handler.setSelector(selector);
    }
    return this;
  }
  setHandler(...args) {
    args.forEach((arg) => {
      if (typeof arg == "object") {
        this.handler.setHandlerObject(arg);
      } else if (typeof arg == "function") {
        this.handler.setHandlerFunction(arg);
      }
    });
    return this;
  }

  withShift(require) {
    this.handler.setWithShift(require);
    return this;
  }
  withAlt(require) {
    this.handler.setWithAlt(require);
    return this;
  }
  withCtrl(require) {
    this.handler.setWithCtrl(require);
    return this;
  }
  setHandlerObject(obj) {
    this.handler.setHandlerObject(obj);
    return this;
  }
  setData(data) {
    this.handler.setData(data);
    return this;
  }
  setHandlerFunction(func) {
    this.handler.setHandlerFunctionfunc(func);
    return this;
  }
  setTypeName(typeName) {
    this.handler.setTypeName(typeName);
    return this;
  }
  selector(sel) {
    this.handler.setSelector(sel);
    return this;
  }
  exclude(sel) {
    this.handler.exclude(sel);
    return this;
  }

  // default debouncer is 250msecs
  debounce() {
    this.setDebounceMSecs(250);
    return this;
  }
  setDebounceMSecs(msecs = 250) {
    this.handler.setDebounceMSecs(msecs);
    return this;
  }
  build() {
    this.handler.listen();
    return this.handler;
  }
}

export class EventHandler {
  constructor(...args) {
    this.defaultResponse = HandlerResponse.StopPropagation;
    this.eventProcessor = this.eventProcessorMethod.bind(this);
    this.listenElement = null;
    this.handlerObject = null;
    this.handlerFunc = null;
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

    if (args.length == 0) {
      return;
    }
    if (args.length == 1 && typeof args[0] == "string") {
      this.setTypeName(args[0]);
      return;
    }

    args.forEach((arg) => {
      if (arg instanceof HTMLElement) {
        this.setListenElement(arg);
      } else if (arg instanceof ObjectEventType) {
        this.setTypeName(arg.name);
      } else if (typeof arg === "object") {
        this.handlerObject = arg;
      } else if (typeof arg === "function") {
        this.handlerFunc = arg;
      } else if (typeof arg === "string") {
        if (this.typeName == null) {
          this.setTypeName(arg);
        } else if (this.selector == null) {
          this.setSelector(arg);
        }
      }
    });
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
  setHandler(...args) {
    args.forEach((arg) => {
      if (typeof arg == "object") {
        this.setHandlerObject(arg);
      } else if (typeof arg == "function") {
        this.setHandlerFunction(arg);
      }
    });
    return this;
  }
  setHandlerObject(obj) {
    this.handlerObject = obj;
    return this;
  }
  setHandlerFunction(func) {
    this.handlerFunc = func;
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

  listen() {
    if (this.typeName == null) {
      log.error("EventHandler requires an event type name (e.g. 'click'");
      return;
    }
    this.typeNames = Util.toArray(this.getEventType());

    this.typeNames.forEach((typeName) => {
      if (this.listenElement != null) {
        dom.addListener(this.listenElement, typeName, this.eventProcessor);
      } else if (this.selector != null) {
        this.listenElement = dom.find(this.selector);
        dom.addListener(this.listenElement, typeName, this.eventProcessor);
      } else {
        log.error("EventHandler needs an element or selector");
      }
    });
    return this;
  }

  remove() {
    if (this.listenElement) {
      this.typeNames.forEach((typeName) => {
        dom.removeListener(this.listenElement, typeName, this.eventProcessor);
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
    return dom.parent(event.target, this.selector);
  }

  selectorMismatch(event) {
    return (
      this.selector != null && !dom.isElementIn(event.target, this.selector)
    );
  }

  eventProcessorMethod(event) {
    if (this.withAlt && !event.altKey) {
      return HandlerResponse.Continue;
    }
    if (this.withCtrl && !event.ctrlKey) {
      return HandlerResponse.Continue;
    }
    if (this.withShift && !event.shiftKey) {
      return HandlerResponse.Continue;
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
      }, this.debounceMSecs);
    } else {
      this.invokeHandler(event);
    }
  }

  invokeHandler(event) {
    var result = null;
    var method = null;
    if (this.selectorMismatch(event)) {
      return;
    }
    if (
      this.excludeSelector != null &&
      event.target.matches(this.excludeSelector)
    ) {
      return;
    }
    if (this.dataSource) {
      if (typeof this.dataSource == "function") {
        this.data = this.dataSource(this.getEventTarget(event));
      } else {
        this.data = this.dataSource;
      }
    }
    if (this.handlerFunc) {
      var func = this.handlerFunc;
      if (this.handlerObject) {
        method = func.bind(this.handlerObject);
      }
      result = this.defaultResponse;
    } else if (this.handlerObject) {
      method = this.findHandlerMethod(this.handlerObject, this.typeName);
    }

    result = this.callHandler(method, event);

    if (result == null) {
      result = this.defaultResponse || HandlerResponse.stopPropagation;
    }

    if (
      result == HandlerResponse.stopPropagation ||
      result == HandlerResponse.StopAll
    ) {
      event.stopPropagation();
    }
    if (
      result == HandlerResponse.StopDefault ||
      result == HandlerResponse.StopAll
    ) {
      event.preventDefault();
    }
  }

  // allow derived classed to just override this.
  // they can change values or parse the event and pass additional args
  callHandler(method, event) {
    try {
      if (method != null) {
        method(event, this.data);
      }
    } catch (ex) {
      log.error(ex, "event handler for ", this.typeName, " failed");
    }
  }
  findHandlerMethod(obj, name) {
    if (typeof obj[name] == "function") {
      return obj[name].bind(obj);
    }
    if (obj instanceof HandlerMethod) {
      return obj.getMethod(name);
    }
    var lower = name.toLowerCase();
    var onLower = "on" + lower;
    var methodName = Object.getOwnPropertyNames(
      Object.getPrototypeOf(obj)
    ).find((propName) => {
      var lowerProp = propName.toLowerCase();
      if (lower == lowerProp || onLower == lowerProp) {
        var func = obj[propName];
        if (typeof func == "function") {
          return true;
        }
      }
      return false;
    });
    return methodName == null ? null : obj[methodName];
  }
  exclude(selector) {
    this.excludeSelector = selector;
    return this;
  }
}

export default { EventHandlerBuilder, EventHandler };
