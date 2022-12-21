export class HandlerResponse {}
class ResponseStopPropagation extends HandlerResponse {}
class ResponseStopDefault extends HandlerResponse {}
class ResponseStopAll extends HandlerResponse {}
class ResponseContinue extends HandlerResponse {}

HandlerResponse.StopDefault = new ResponseStopDefault();
HandlerResponse.StopPropagation = new ResponseStopPropagation();
HandlerResponse.StopAll = new ResponseStopAll();
HandlerResponse.Continue = new ResponseContinue();

export function DoNothing() {
  return false;
}

export class MousePosition {
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

export class ObjectEventType {
  constructor(name) {
    this.name = name;
  }

  getName() {
    return this.name;
  }
}

export class HandlerMethod {
  static None() {
    return NullHandlerMethod;
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

  call(...args) {
    if (this.handlerFunction) {
      this.handlerFunction.apply(this.handlerObject, args);
    }
  }
}

const NullHandlerMethod = new HandlerMethod(null, null, null);

export default { MousePosition, HandlerMethod, ObjectEventType };
