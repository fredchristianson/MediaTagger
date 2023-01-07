import { LOG_LEVEL, Logger } from "../../logger.js";
import { default as dom } from "../dom.js";
import {
  EventHandlerBuilder,
  EventHandler,
  HandlerResponse,
  HandlerMethod,
} from "./handler.js";

const log = Logger.create("InputHandler", LOG_LEVEL.WARN);

export function BuildInputHandler() {
  return new InputHandlerBuilder();
}
export class InputHandlerBuilder extends EventHandlerBuilder {
  constructor(type) {
    super(type || InputHandler);
    this.ENTER_KEY = 13;
    this.ESCAPE_KEY = 27;
  }

  onChange(...args) {
    this.handlerInstance.setOnChange(new HandlerMethod(...args, "onChange"));
    return this;
  }
  onInput(...args) {
    this.handlerInstance.setOnInput(new HandlerMethod(...args, "onInput"));
    return this;
  }
  onBlur(...args) {
    this.handlerInstance.setOnBlur(new HandlerMethod(...args, "onBlur"));
    return this;
  }
  onFocus(...args) {
    this.handlerInstance.setOnFocus(new HandlerMethod(...args, "onFocus"));
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
    this.handlerInstance.setOnKey(
      this.KEY_KEY,
      new HandlerMethod(...args, "onKey")
    );
    return this;
  }
}

export class InputHandler extends EventHandler {
  constructor(...args) {
    super(...args);
    this.setTypeName(["input", "change", "focusin", "focusout", "keydown"]);
    this.setDefaultResponse(HandlerResponse.Continue);
    this.onChange = HandlerMethod.None();
    this.onInput = HandlerMethod.None();
    this.onFocus = HandlerMethod.None();
    this.onBlur = HandlerMethod.None();
    this.keyHandler = {};
  }

  setOnChange(handler) {
    this.onChange = handler;
  }
  setOnInput(handler) {
    this.onInput = handler;
  }
  setOnBlur(handler) {
    this.onBlur = handler;
  }
  setOnFocus(handler) {
    this.onFocus = handler;
  }

  setOnKey(key, handler) {
    this.keyHandler[key] = handler;
  }

  invokeChange(method, event) {
    method(
      this.getValue(event.target),
      event.currentTarget,
      this.data,
      event,
      this
    );
  }

  callHandler(method, event) {
    try {
      var method = null;
      var target = this.getEventTarget(event);
      var value = this.getValue(target);
      if (event.type == "input") {
        method = this.onInput;
      } else if (event.type == "change") {
        method = this.onChange;
      } else if (event.type == "focusout") {
        method = this.onBlur;
      } else if (event.type == "focusin") {
        method = this.onFocus;
      } else if (event.type == "keydown") {
        var handler = this.keyHandler[event.which];
        if (handler) {
          var key = event.which;
          handler.call(target, event, key, value);
        }
      }
      if (method != null) {
        method.setData(this.dataSource, this.data);
        method.call(value, target, event);
      }
    } catch (ex) {
      log.error(ex, "event handler for ", this.typeName, " failed");
    }
  }
  getValue(element) {
    return dom.getValue(element);
  }
}

export default { InputHandlerBuilder, BuildInputHandler, InputHandler };
