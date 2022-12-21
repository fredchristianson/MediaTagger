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
  }

  onChange(...args) {
    this.handlerInstance.setOnChange(new HandlerMethod(...args, "onChange"));
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
}

export class InputHandler extends EventHandler {
  constructor(...args) {
    super(...args);
    this.setTypeName(["input", "focus", "blur"]);
    this.setDefaultResponse(HandlerResponse.Continue);
    this.onChange = HandlerMethod.None();
    this.onFocus = HandlerMethod.None();
    this.onBlur = HandlerMethod.None();
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
      if (event.type == "input" || event.type == "change") {
        if (method != null) {
          method.call(event.target, this.data, event, this);
        }
        this.onChange.call(
          this.getValue(event.target),
          this.getEventTarget(event),
          this.data,
          event,
          this
        );
      } else if (event.type == "blur" && this.onBlur) {
        this.onBlur.call(
          this.getValue(event.target),
          this.getEventTarget(event),
          this.data,
          event,
          this
        );
      } else if (event.type == "focus" && this.onFocus) {
        this.onFocus.call(
          this.getValue(event.target),
          this.getEventTarget(event),
          this.data,
          event,
          this
        );
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
