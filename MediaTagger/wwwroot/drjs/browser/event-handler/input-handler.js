import { LOG_LEVEL, Logger } from '../../logger.js';
import { default as dom } from '../dom.js';
import {
  EventHandlerBuilder,
  EventListener,
  Continuation,
  HandlerMethod
} from './handler.js';

const log = Logger.create('InputHandler', LOG_LEVEL.WARN);

function BuildInputHandler() {
  return new InputHandlerBuilder();
}
class InputHandlerBuilder extends EventHandlerBuilder {
  constructor(type) {
    super(type || InputHandler);
    this.ENTER_KEY = 13;
    this.ESCAPE_KEY = 27;
  }

  onChange(...args) {
    this.handlerInstance.setOnChange(new HandlerMethod(...args, 'onChange'));
    return this;
  }
  onInput(...args) {
    this.handlerInstance.setOnInput(new HandlerMethod(...args, 'onInput'));
    return this;
  }
  onFocus(...args) {
    this.handlerInstance.setOnFocus(new HandlerMethod(...args, 'onBlur'));
    return this;
  }
  onBlur(...args) {
    this.handlerInstance.setOnBlur(new HandlerMethod(...args, 'onFocus'));
    return this;
  }
  onFocusOut(...args) {
    this.handlerInstance.setOnFocusOut(new HandlerMethod(...args, 'onBlur'));
    return this;
  }
  onFocusIn(...args) {
    this.handlerInstance.setOnFocusIn(new HandlerMethod(...args, 'onFocus'));
    return this;
  }
  onEnter(...args) {
    this.handlerInstance.setOnKey(
      this.ENTER_KEY,
      new HandlerMethod(...args, 'onEnter')
    );
    return this;
  }
  onEscape(...args) {
    this.handlerInstance.setOnKey(
      this.ESCAPE_KEY,
      new HandlerMethod(...args, 'onEscape')
    );
    return this;
  }
  onKey(key, ...args) {
    this.handlerInstance.setOnKey(
      this.KEY_KEY,
      new HandlerMethod(...args, 'onKey')
    );
    return this;
  }
}

class InputHandler extends EventListener {
  constructor(...args) {
    super(...args);
    this.setTypeName([
      'input',
      'change',
      'focus',
      'blur',
      'focusin',
      'focusout',
      'keydown'
    ]);
    this.setDefaultContinuation(Continuation.Continue);
    this.onChange = HandlerMethod.None;
    this.onInput = HandlerMethod.None;
    this.onFocus = HandlerMethod.None;
    this.onBlur = HandlerMethod.None;
    this.onFocusIn = HandlerMethod.None;
    this.onFocusOut = HandlerMethod.None;
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
  setOnFocusIn(handler) {
    this.onFocusIn = handler;
  }
  setOnFocusOut(handler) {
    this.onFocusOut = handler;
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

  callHandlers(event) {
    try {
      let method = null;
      let target = this.getEventTarget(event);
      let value = this.getValue(target);
      let response = Continuation.Continue;
      if (event.type == 'input') {
        method = this.onInput;
      } else if (event.type == 'change') {
        method = this.onChange;
      } else if (event.type == 'focusout') {
        method = this.onFocusOut;
      } else if (event.type == 'focusin') {
        method = this.onFocusIn;
      } else if (event.type == 'blur') {
        method = this.onBlur;
      } else if (event.type == 'focus') {
        method = this.onFocus;
      } else if (event.type == 'keydown') {
        let handler = this.keyHandler[event.which];
        if (handler) {
          let key = event.which;
          response.combine(handler.call(target, event, key, value));
        }
      }
      if (method != null) {
        response.combine(method.call(this, event, value));
      }
      return response;
    } catch (ex) {
      log.error(ex, 'event handler for ', this.typeName, ' failed');
    }
  }
  getValue(element) {
    return dom.getValue(element);
  }
}

export { InputHandlerBuilder, BuildInputHandler, InputHandler };
