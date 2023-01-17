import { LOG_LEVEL, Logger } from "../../logger.js";
import Util from "../../util.js";
import { DOM, default as dom } from "../dom.js";
import { Continuation, HandlerMethod, DataHandlerMethod } from "./common.js";
export * from "./common.js";

const log = Logger.create("EventListener", LOG_LEVEL.DEBUG);

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
    this.handlerInstance.setFilterAllow(filterFunction);
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

  setDefaultContinuation(continuation) {
    this.handlerInstance.setDefaultContinuation(continuation);
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
  setData(...data) {
    var method = null;
    if (data.length < 2 && typeof data[0] != "function") {
      method = data[0];
    } else {
      method = new DataHandlerMethod(...data);
    }
    this.handlerInstance.setData(method);
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
  setOnce() {
    this.handlerInstance.Once = true;
  }
  build() {
    this.handlerInstance.listen();
    return this.handlerInstance;
  }
}

export class EventListener {
  constructor(handler = null) {
    this._defaultContinuation = Continuation.Continue;
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
    this.handlerMethod = handler;
    this.capture = null;
    this.filterFunction = null;
    this.once = false;
  }

  set Once(once) {
    this.once = once;
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

  setDefaultContinuation(response) {
    this._defaultContinuation = response;
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

    this.typeNames = Util.toArray(this.getEventType());

    const options = {
      passive: this.isPassive(),
      capture: this.isCapture(),
      once: this.once,
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
        log.error("EventListener needs an element or selector");
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

  get DefaultContinuation() {
    return this._defaultContinuation.clone();
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
    this.defaultResponse = this._defaultContinuation.clone();
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
    if (this.once) {
      // in case the option wasn't set until after listening
      this.remove();
    }
  }

  async invokeHandler(event) {
    var result = this.defaultResponse.clone();

    // if there is a handlerMethod, call it.
    // in most cases, this is null and the derived class overrides callHandlers()
    if (this.handlerMethod != null) {
      try {
        await this.handlerMethod.call(this, event);
      } catch (ex) {
        log.error(ex, "default handler method failed");
      }
    }
    result.replace(this.callHandlers(event));
    result.finishEvent(event);
  }

  // allow derived classes to call handlers.
  // they can change values or parse the event and pass additional args
  callHandlers(event) {}

  exclude(selector) {
    this.excludeSelector = selector;
    return this;
  }
}

export default { EventHandlerBuilder, EventListener };
