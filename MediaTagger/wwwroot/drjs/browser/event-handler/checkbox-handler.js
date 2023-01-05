import { LOG_LEVEL, Logger } from "../../logger.js";
import { default as dom } from "../dom.js";
import { HandlerMethod, HandlerResponse } from "./common.js";
import { InputHandlerBuilder, InputHandler } from "./input-handler.js";

const log = Logger.create("CheckboxHandler", LOG_LEVEL.WARN);

export function BuildCheckboxHandler() {
  return new CheckboxHandlerBuilder();
}

export class CheckboxHandlerBuilder extends InputHandlerBuilder {
  constructor() {
    super(CheckboxHandler);
  }

  onChecked(...args) {
    this.handlerInstance.checkedHandler = HandlerMethod.Of(...args, "onCheck");
    return this;
  }
  onUnchecked(...args) {
    this.handlerInstance.uncheckedHandler = HandlerMethod.Of(
      ...args,
      "onUncheck"
    );
    return this;
  }
}

export class CheckboxHandler extends InputHandler {
  constructor(...args) {
    super(...args);
    this.checkedHandler = HandlerMethod.None();
    this.uncheckedHandler = HandlerMethod.None();
  }
  getValue(element) {
    return dom.isChecked(element);
  }

  callHandler(method, event) {
    super.callHandler(method, event);
    var target = this.getEventTarget(event);
    if (event.type == "input") {
      if (dom.isChecked(target)) {
        if (this.dataSource) {
          this.checkedHandler.call(this.data, target, event);
        } else {
          this.checkedHandler.call(target, event);
        }
        return HandlerResponse.StopAll;
      } else {
        if (this.dataSource) {
          this.uncheckedHandler.call(this.data, target, event);
        } else {
          this.uncheckedHandler.call(target, event);
        }
        return HandlerResponse.StopAll;
      }
    }
  }
}

export default { BuildCheckboxHandler, CheckboxHandler };
