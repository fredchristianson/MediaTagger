import { LOG_LEVEL, Logger } from "../../logger.js";
import { default as dom } from "../dom.js";
import { InputHandlerBuilder, InputHandler } from "./input-handler.js";

const log = Logger.create("CheckboxHandler", LOG_LEVEL.WARN);

export function BuildCheckboxHandler() {
  return new CheckboxHandlerBuilder();
}

export class CheckboxHandlerBuilder extends InputHandlerBuilder {
  constructor() {
    super(CheckboxHandler);
  }
}

export class CheckboxHandler extends InputHandler {
  constructor(...args) {
    super(...args);
  }

  invokeChange(method, event) {
    method(
      dom.isChecked(event.target),
      event.currentTarget,
      this.data,
      event,
      this
    );
  }
}

export default { BuildCheckboxHandler, CheckboxHandler };
