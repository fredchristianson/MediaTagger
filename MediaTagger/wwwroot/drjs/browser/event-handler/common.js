class EventHandlerReturn {
  static get StopAll() {
    return new StopAllHandlerReturn();
  }
  static get StopPropagation() {
    return new StopPropagationHandlerReturn();
  }
  static get PreventDefault() {
    return new PreventDefaultHandlerReturn();
  }
  static get Continue() {
    return new ContinueHandlerReturn();
  }

  constructor(
    stopPropagation = false,
    preventDefault = false,
    immediate = true
  ) {
    this.stopEventPropagation = stopPropagation;
    this.preventEventDefault = preventDefault;
    this.immediate = immediate;
  }

  clone() {
    return new EventHandlerReturn(
      this.stopEventPropagation,
      this.preventDefault,
      this.immediate
    );
  }

  set preventDefault(prevent = true) {
    this.preventEventDefault = prevent;
  }
  set stopPropagation(stop = true) {
    this.stopEventPropagation = stop;
    this.immediate = true;
  }
  set stopPropagationImmediate(stop = true) {
    this.immediate = stop;
  }
  combine(other = null) {
    // if other is an EventHandlerReturn, use the most restrictive handling
    if (other == null || !(other instanceof EventHandlerReturn)) {
      return;
    }
    this.stopEventPropagation =
      this.stopEventPropagation || other.stopEventPropagation;
    this.preventDefault = this.preventDefault || other.preventDefault;
    this.immediate = this.immediate || other.immediate;
  }

  combineOrStop(other) {
    // if other is an EventHandlerReturn, use the most restrictive handling
    // if other is not an EventHandlerResponse, stop & prevent
    if (other == null || !(other instanceof EventHandlerReturn)) {
      this.stopEventPropagation = true;
      this.preventDefault = true;
      this.immediate = true;
      return;
    }
    this.stopEventPropagation =
      this.stopEventPropagation || other.stopEventPropagation;
    this.preventEventDefault =
      this.preventEventDefault || other.preventEventDefault;
    this.immediate = this.immediate || other.immediate;
  }

  replace(other) {
    // if other is not null, replace this response values with the other
    // do nothing if other is null
    if (other == null || !(other instanceof EventHandlerReturn)) {
      return;
    }
    this.stopEventPropagation = other.stopEventPropagation;
    this.preventEventDefault = other.preventEventDefault;
    this.immediate = other.immediate;
  }

  notImmediate() {
    this.immediate = false;
  }

  finishEvent(event) {
    if (this.stopEventPropagation) {
      if (this.immediate) {
        event.stopImmediatePropagation();
      } else {
        event.stopPropagation();
      }
    }
    if (this.preventEventDefault) {
      event.preventDefault();
    }
  }
}

class StopAllHandlerReturn extends EventHandlerReturn {
  constructor() {
    super(true, true);
  }
}

class StopPropagationHandlerReturn extends EventHandlerReturn {
  constructor() {
    super(true, false);
  }
}

class PreventDefaultHandlerReturn extends EventHandlerReturn {
  constructor() {
    super(false, true);
  }
}

class ContinueHandlerReturn extends EventHandlerReturn {
  constructor() {
    super(false, false);
  }
}

function DoNothing() {
  return false;
}

class MousePosition {
  constructor(event = null) {
    this.event = event;
    this.x = 0;
    this.y = 0;
    this.pctX = 0;
    this.pctY = 0;
    this.update(event);
  }

  update(event) {
    this.event = event;
    if (event != null) {
      var target = event.currentTarget;
      this.width = target.clientWidth;
      this.height = target.clientHeight;
      this.x = event.offsetX;
      this.y = event.offsetY;
      this.pctX = this.width > 0 ? (this.x * 1.0) / this.width : 0;
      this.pctY = this.height > 0 ? (this.y * 1.0) / this.height : 0;
    }
  }

  // pctX and pctY are [0...1].
  // xPercent() and yPercent() are integers [0...100]
  xPercent() {
    return Math.floor(this.pctX * 100);
  }
  yPercent() {
    return Math.floor(this.pctY * 100);
  }
}

class ObjectEventType {
  constructor(name) {
    this.name = name;
  }

  getName() {
    return this.name;
  }
}

class HandlerMethod {
  static None() {
    return new HandlerMethod(null, null, null);
  }
  static Of(...args) {
    if (args[0] instanceof HandlerMethod) {
      return args[0];
    }
    return new HandlerMethod(...args);
  }
  constructor(object, method, defaultMethod) {
    if (typeof object == "function") {
      this.handlerObject = null;
      this.handlerFunction = object;
      this.dataSource = null;
      this.data = null;
      return;
    }
    this.handlerObject = object;
    var meth = method ?? defaultMethod;
    if (typeof meth == "string" && object != null) {
      meth = object[meth];
    }
    if (typeof meth == "function") {
      this.handlerFunction = meth;
    } else {
      this.handlerFunction = null;
    }
  }

  setData(dataSource, data) {
    this.dataSource = dataSource;
    this.data = data;
  }
  call(...args) {
    if (this.handlerFunction) {
      if (this.dataSource) {
        return this.handlerFunction.call(
          this.handlerObject,
          this.data,
          ...args
        );
      } else {
        return this.handlerFunction.apply(this.handlerObject, args);
      }
    }
    return EventHandlerReturn.Continue;
  }
}

export {
  DoNothing,
  MousePosition,
  HandlerMethod,
  ObjectEventType,
  EventHandlerReturn,
  StopAllHandlerReturn,
  StopPropagationHandlerReturn,
  ContinueHandlerReturn,
  PreventDefaultHandlerReturn,
};
