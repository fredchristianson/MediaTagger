import { LOG_LEVEL, Logger } from '../../logger.js';
import {
  EventHandlerBuilder,
  EventListener,
  HandlerMethod,
  DoNothing
} from './handler.js';

const log = Logger.create('ClickHandler', LOG_LEVEL.WARN);

export function BuildClickHandler() {
  return new ClickHandlerBuilder(ClickHandler);
}

export class ClickHandlerBuilder extends EventHandlerBuilder {
  constructor(type = null) {
    super(type || ClickHandler);
  }

  onClick(...args) {
    this.handlerInstance.setOnClick(new HandlerMethod(...args));
    return this;
  }
  onLeftClick(...args) {
    this.handlerInstance.setOnLeftClick(new HandlerMethod(...args));
    return this;
  }
  onRightClick(...args) {
    this.handlerInstance.setOnRightClick(new HandlerMethod(...args));
    return this;
  }
  onMiddleClick(...args) {
    this.handlerInstance.setOnMiddleClick(new HandlerMethod(...args));
    return this;
  }
}

export class ClickHandler extends EventListener {
  constructor(...args) {
    super(...args);
    this.setTypeName([
      'click',
      'mouseup',
      'mousedown',
      'mouseover',
      'mouseout'
    ]);

    this.onClick = HandlerMethod.None;
    this.onLeftClick = HandlerMethod.None;
    this.onRightClick = HandlerMethod.None;
    this.onMiddleClick = HandlerMethod.None;
  }

  setOnClick(handler) {
    this.onClick = handler;
  }
  setOnLeftClick(handler) {
    this.onLeftClick = handler;
  }
  setOnRightClick(handler) {
    this.onRightClick = handler;
  }
  setOnMiddleClick(handler) {
    this.onMiddleClick = handler;
  }

  callHandlers(event) {
    try {
      const response = this.defaultResponse.clone();

      if (event.type == 'mouseover') {
        if (this.onRightClick.IsValid) {
          document.oncontextmenu = DoNothing;
        }
        return;
      } else if (event.type == 'mouseout') {
        if (this.onRightClick) {
          document.oncontextmenu = null;
        }
        return;
      }
      if (event.type == 'mousedown') {
        if (event.button == 1 && this.onMiddleClick) {
          response.preventDefault = true;
          event.preventDefault(); // don't scroll if middle click handler exists
        }
      }

      if (event.type == 'click' && this.onClick != null) {
        response.combine(this.onClick.call(this, event));
      }
      if (event.type == 'mouseup') {
        if (event.button == 0) {
          response.combine(this.onLeftClick.call(this, event));
        }
        if (event.button == 1) {
          response.combine(this.onMiddleClick.call(this, event));
        }
        if (event.button == 2) {
          response.combine(this.onRightClick.call(this, event));
        }
      }
      return response;
    } catch (ex) {
      log.error(ex, 'event handler for ', this.typeName, ' failed');
    }
  }
}

export default { BuildClickHandler, ClickHandlerBuilder, ClickHandler };
