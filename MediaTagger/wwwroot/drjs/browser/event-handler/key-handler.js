import { LOG_LEVEL, Logger } from "../../logger.js";
import { default as dom } from "../dom.js";
import {
  EventHandlerBuilder,
  EventHandler,
  HandlerResponse,
  HandlerMethod,
} from "./handler.js";

const log = Logger.create("KeyHandler", LOG_LEVEL.WARN);

export function BuildKeyHandler() {
  return new KeyHandlerBuilder();
}
export class KeyHandlerBuilder extends EventHandlerBuilder {
  constructor(type) {
    super(type || KeyHandler);
    this.ENTER_KEY = "Enter";
    this.ESCAPE_KEY = "Escape";
  }

  onKeyDown(...args) {
    this.handlerInstance.setOnKeyDown(new HandlerMethod(...args, "onKeyDown"));
    return this;
  }
  onKeyUp(...args) {
    this.handlerInstance.setOnKeyUp(new HandlerMethod(...args, "onKeyUp"));
    return this;
  }
  onEnter(...args) {
    this.handlerInstance.setOnKey(
      this.ENTER_KEY,
      new HandlerMethod(...args, "onEnter")
    );
    return this;
  }
  onEscape(...args) {
    this.handlerInstance.setOnKey(
      this.ESCAPE_KEY,
      new HandlerMethod(...args, "onEscape")
    );
    return this;
  }
  onKey(key, ...args) {
    this.handlerInstance.setOnKey(key, new HandlerMethod(...args, "onKey"));
    return this;
  }
}

export class KeyHandler extends EventHandler {
  constructor(...args) {
    super(...args);
    this.setTypeName(["keydown", "keyup"]);
    this.setDefaultResponse(HandlerResponse.Continue);
    this.onKeyDown = HandlerMethod.None();
    this.onKeyUp = HandlerMethod.None();
    this.keyHandler = {};
  }

  setOnKeyDown(handler) {
    this.onKeyDown = handler;
  }
  setOnKeyUp(handler) {
    this.onKeyUp = handler;
  }

  setOnKey(key, handler) {
    this.keyHandler[key] = handler;
  }

  callHandler(method, event) {
    try {
      var response = null;
      var target = this.getEventTarget(event);
      if (event.type == "keydown") {
        this.onKeyDown.setData(this.dataSource, this.data);
        var keyDownResponse = this.onKeyDown.call(event.key, target, event);
        response = response ?? keyDownResponse;
        var handler = this.keyHandler[event.key];
        if (handler) {
          var key = event.key;
          handler.setData(this.dataSource, this.data);
          var handlerResponse = handler.call(key, target, event);
          response = response ?? handlerResponse;
        }
      } else if (event.type == "keyup") {
        this.onKeyUp.setData(this.dataSource, this.data);
        var keyUpResponse = this.onKeyUp.call(event.key, target, event);
        response = response ?? keyUpResponse;
      }
      return response;
    } catch (ex) {
      log.error(ex, "event handler for ", this.typeName, " failed");
    }
  }
  getValue(element) {
    return dom.getValue(element);
  }
}

export default { KeyHandlerBuilder, BuildKeyHandler, KeyHandler };
