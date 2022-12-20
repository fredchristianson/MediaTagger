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
      method = this.handlerFunction;
    }
    return method;
  }
}

export default { MousePosition, HandlerMethod, ObjectEventType };
