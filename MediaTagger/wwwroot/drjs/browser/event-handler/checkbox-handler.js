import { LOG_LEVEL, Logger } from "../../logger.js";
import { default as dom } from "../dom.js";
import { HandlerMethod, EventHandlerReturn } from "./common.js";
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
    var response = EventHandlerReturn.Continue;
    if (event.type == "change") {
      response.replace(EventHandlerReturn.StopAll);
      if (dom.isChecked(target)) {
        if (this.dataSource) {
          response.replace(this.checkedHandler.call(this.data, target, event));
        } else {
          response.replace(this.checkedHandler.call(target, event));
        }
      } else {
        if (this.dataSource) {
          response.replace(
            this.uncheckedHandler.call(this.data, target, event)
          );
        } else {
          response.replace(this.uncheckedHandler.call(target, event));
        }
      }
    }
    return response;
  }
}

export default { BuildCheckboxHandler, CheckboxHandler };
