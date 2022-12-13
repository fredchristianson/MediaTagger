import assert from "../assert.js";
import Logger from "../logger.js";
import Util from "../util.js";
import { DOM, default as dom } from "./dom.js";

const log = Logger.create("Event");

export class HandlerResponse {}
export class ResponseStopPropagation extends HandlerResponse {}
export class ResponseStopDefault extends HandlerResponse {}
export class ResponseStopAll extends HandlerResponse {}
export class ResponseContinue extends HandlerResponse {}

export class Listeners extends Array {
  constructor(...args) {
    super();
    args.forEach((arg) => {
      this.push(arg);
    });
  }

  removeAll() {
    this.forEach((listener) => {
      listener.remove();
    });
    length = 0;
  }
}

export class ObjectEventType {
  constructor(name) {
    this.name = name;
  }

  getName() {
    return this.name;
  }
}

export class HandlerMethod {
  constructor(...args) {
    this.handlerFunctionName = null;
    this.handlerFunction = null;
    this.handlerObject = null;
    args.forEach((arg) => {
      if (typeof arg == "object") {
        this.handlerObject = arg;
      } else if (typeof arg == "function") {
        this.handlerFunction = arg;
      } else if (typeof arg == "string") {
        this.handlerFunctionName = arg;
      }
    });
  }

  getMethod(defaultMethod) {
    var defName = this.handlerFunctionName;
    var defFunc = null;
    if (typeof defaultMethod == "object") {
      defName = defName || defaultMethod.defaultName || defaultMethod.default;
      defFunc = defaultMethod.defaultFunction || defaultMethod.default;
    } else if (typeof defaultMethod == "function") {
      defFunc = defaultMethod;
    } else if (typeof defaultMethod == "string") {
      defName = defName || defaultMethod;
    }
    var method = defFunc;

    if (this.handlerObject) {
      if (this.handlerFunction && typeof this.handlerFunction == "function") {
        method = this.handlerFunction;
      } else if (typeof this.handlerFunction == "string") {
        method = this.handlerObject[this.handlerFunction];
      } else if (defName != null && this.handlerObject[defName]) {
        method = this.handlerObject[defName];
      }
      if (method) {
        method = method.bind(this.handlerObject);
      }
    } else if (typeof this.handlerFunction == "function") {
      method = handlerFunction;
    }
    return method;
  }
}

export class EventHandlerBuilder {
  constructor(eventHandlerClass) {
    this.handlerClass = eventHandlerClass;
    this.handler = new this.handlerClass();
  }

  listenTo(element) {
    if (element instanceof DOM) {
      this.handler.listenElement = element.getRoot();
    } else {
      this.handler.listenElement = element;
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

export class InputHandlerBuilder extends EventHandlerBuilder {
  constructor(type) {
    super(type || InputHandler);
  }

  onChange(...args) {
    this.handler.setOnChange(new HandlerMethod(...args));
    return this;
  }
  onBlur(...args) {
    this.handler.setOnBlur(new HandlerMethod(...args));
    return this;
  }
  onFocus(...args) {
    this.handler.setOnFocus(new HandlerMethod(...args));
    return this;
  }
}

export class ClickHandlerBuilder extends EventHandlerBuilder {
  constructor(type) {
    super(type || InputHandler);
  }

  onClick(...args) {
    this.handler.setOnClick(new HandlerMethod(...args));
    return this;
  }
}

export class ScrollHandlerBuilder extends EventHandlerBuilder {
  constructor(type) {
    super(type || ScrollHandler);
  }

  onScroll(...args) {
    this.handler.setOnScroll(new HandlerMethod(...args));
    return this;
  }
}

export class CheckboxHandlerBuilder extends InputHandlerBuilder {
  constructor() {
    super(CheckboxHandler);
  }
}

export class WheelHandlerBuilder extends EventHandlerBuilder {
  constructor() {
    super(WheelHandler);
  }
  onChange(...args) {
    this.handler.setOnChange(new HandlerMethod(...args));
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
}

export function BuildHandler(handlerClass) {
  return new EventHandlerBuilder(handlerClass);
}

export function BuildClickHandler() {
  return new ClickHandlerBuilder(ClickHandler);
}

export function BuildScrollHandler() {
  return new ScrollHandlerBuilder(ScrollHandler);
}

export function BuildInputHandler() {
  return new InputHandlerBuilder();
}

export function BuildCheckboxHandler() {
  return new CheckboxHandlerBuilder();
}

export function BuildWheelHandler() {
  return new WheelHandlerBuilder();
}

export class EventHandler {
  constructor(...args) {
    this.defaultResponse = ResponseStopPropagation;
    this.eventProcessor = this.eventProcessorMethod.bind(this);
    this.listenElement = null;
    this.handlerObject = null;
    this.handlerFunc = null;
    this.typeName = null;
    this.selector = null;
    this.excludeSelector = null;
    this.data = null;
    this.debounceMSecs = 0;
    this.debounceTimer = null;

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
    this.data = data;
    return this;
  }

  setDefaultResponse(response) {
    this.defaultResponse = response;
  }

  setDebounceMSecs(msecs) {
    this.debounceMSecs = msecs;
  }

  listen() {
    if (this.typeName == null) {
      log.error("EventHandler requires an event type name (e.g. 'click'");
      return;
    }
    this.typeNames = Util.toArray(this.typeName);

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

  selectorMismatch(event) {
    return this.selector != null && !event.target.matches(this.selector);
  }

  eventProcessorMethod(event) {
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
      result = this.defaultResponse || ResponseStopPropagation;
    }

    if (result == ResponseStopPropagation || result == ResponseStopAll) {
      event.stopPropagation();
    }
    if (result == ResponseStopDefault || result == ResponseStopAll) {
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

export class ClickHandler extends EventHandler {
  constructor(...args) {
    super("click", ...args);
    this.onClick = null;
  }

  setOnClick(handler) {
    this.onClick = handler;
  }

  callHandler(method, event) {
    try {
      if (method != null) {
        method(event.currentTarget, this.data, event, this);
      }
      if (this.onClick != null) {
        var clickMethod = this.onClick.getMethod({ defaultName: "onClick" });
        if (clickMethod) {
          clickMethod(event.currentTarget, this.data, event, this);
        }
      }
    } catch (ex) {
      log.error(ex, "event handler for ", this.typeName, " failed");
    }
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

export class InputHandler extends EventHandler {
  constructor(...args) {
    super(...args);
    this.setTypeName(["input", "focus", "blur"]);
    this.setDefaultResponse(ResponseContinue);
    this.onChange = null;
    this.onFocus = null;
    this.onBlur = null;
  }

  setOnChange(handler) {
    this.onChange = handler;
  }
  setOnBlur(handler) {
    this.onBlur = handler;
  }
  setOnFocus(handler) {
    this.onFocus = handler;
  }

  callHandler(method, event) {
    try {
      if (event.type == "input" || event.type == "change") {
        if (method != null) {
          method(event.target, this.data, event, this);
        }
        if (this.onChange != null) {
          var changeMethod = this.onChange.getMethod({
            defaultName: "onChange",
          });
          if (changeMethod) {
            changeMethod(
              this.getValue(event.target),
              event.currentTarget,
              this.data,
              event,
              this
            );
          }
        }
      } else if (event.type == "blur" && this.onBlur) {
        var blurMethod = this.onBlur.getMethod("onBlur");
        if (blurMethod) {
          blurMethod(event.currentTarget, this.data, event, this);
        }
      } else if (event.type == "focus" && this.onFocus) {
        var focusMethod = this.onFocus.getMethod({ default: "onFocus" });
        if (focusMethod) {
          focusMethod(event.currentTarget, this.data, event, this);
        }
      }
    } catch (ex) {
      log.error(ex, "event handler for ", this.typeName, " failed");
    }
  }
  getValue(element) {
    return dom.getValue(element);
  }
}

export class CheckboxHandler extends InputHandler {
  constructor(...args) {
    super(...args);
  }

  callHandler(method, event) {
    try {
      method(event.currentTarget, this.data, event, this);
    } catch (ex) {
      log.error(ex, "event handler for ", this.typeName, " failed");
    }
  }
}

export class WheelHandler extends EventHandler {
  constructor(...args) {
    super(...args);
    this.setTypeName("wheel");
    this.setDefaultResponse(ResponseStopDefault);
    this.setListenElement(dom.getBody());

    this.onChange = null;
    this.withShift = null;
    this.withCtrl = null;
    this.withAlt = null;
  }

  setOnChange(handler) {
    this.onChange = handler;
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

  callHandler(method, event) {
    try {
      if (this.withAlt && !event.altKey) {
        return ResponseContinue;
      }
      if (this.withCtrl && !event.ctrlKey) {
        return ResponseContinue;
      }
      if (this.withShift && !event.shiftKey) {
        return ResponseContinue;
      }
      log.debug("wheel event ", event.wheelDelta);
      if (method) {
        method(event.currentTarget, this.data, event, this);
      }
      if (this.onChange) {
        var changeMethod = this.onChange.getMethod({
          defaultName: "onChange",
        });
        if (changeMethod) {
          changeMethod(event.wheelDelta, event.target, event, this);
        }
      }
    } catch (ex) {
      log.error(ex, "event handler for ", this.typeName, " failed");
    }
  }
}

export class EventListener extends EventHandler {
  constructor(objectEventType, ...args) {
    super(objectEventType, dom.getBody(), ...args);
    this.defaultResponse = ResponseContinue;
    this.listen();
  }

  callHandler(method, event) {
    const detail = event.detail;
    method(detail.data, detail.object, detail.type);
  }
}

export class ObjectListener extends EventHandler {
  constructor(obj, objectEventType, ...args) {
    super(objectEventType, dom.getBody(), ...args);
    this.target = obj;
    this.listen();
  }

  callHandler(method, event) {
    const detail = event.detail;
    if (
      (this.target == null || this.target == detail.object) &&
      (this.typeName == null ||
        this.typeName == "*" ||
        this.typeName == detail.typeName)
    ) {
      method(detail.object, detail.data, detail.type);
    }
  }
}

export class EventEmitter {
  constructor(type, object) {
    this.type = type;
    if (type instanceof ObjectEventType) {
      this.typeName = type.getName();
    } else {
      this.typeName = type;
    }
    this.object = object;
  }

  createListener(handlerObject, handlerMethod) {
    log.debug(`EventEmitter.createListener ${this.typeName}`);
    var listener = new ObjectListener(this.object, this.type);
    listener.setHandler(new HandlerMethod(handlerObject, handlerMethod));
  }

  emit(data) {
    const detail = {
      object: this.object,
      data: data,
      typeName: this.typeName,
      type: this.type,
    };
    log.debug(`EventEmitter.emit ${this.typeName}`);
    const event = new CustomEvent(this.typeName, { detail: detail });
    dom.getBody().dispatchEvent(event);
  }
}
