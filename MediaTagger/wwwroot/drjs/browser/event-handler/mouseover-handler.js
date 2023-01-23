import { LOG_LEVEL, Logger } from '../../logger.js';
import { EventHandlerBuilder, EventListener } from './handler.js';
import { Continuation, MousePosition, HandlerMethod } from './common.js';
const log = Logger.create('MouseOverHandler', LOG_LEVEL.WARN);

export function BuildMouseOverHandler() {
  return new MouseOverHandlerBuilder();
}

export class MouseOverHandlerBuilder extends EventHandlerBuilder {
  constructor() {
    super(MouseOverHandler);
  }

  onOver(...args) {
    this.handlerInstance.setOnOver(new HandlerMethod(...args));
    return this;
  }
  onOut(...args) {
    this.handlerInstance.setOnOut(new HandlerMethod(...args));
    return this;
  }
  disableContextMenu(disabled = true) {
    this.handlerInstance.disableContextMenu = disabled;
    return this;
  }
}

export class MouseOverHandler extends EventListener {
  constructor(...args) {
    super(...args);
    this.setTypeName(['mouseover', 'mouseout']);
    this.setDefaultContinuation(Continuation.Continue);
    this.endDelayMSecs = 200;
    this.onOver = HandlerMethod.None;
    this.onOut = HandlerMethod.None;
    this.mousePosition = new MousePosition();
    this.disableContextMenu = false;
  }
  setOnOver(handler) {
    this.onOver = handler;
  }
  setOnOut(handler) {
    this.onOut = handler;
  }

  callHandlers(event) {
    this.mousePosition.update(event);
    try {
      let target = this.getEventTarget(event);
      log.never(`mouseover ${target.id}:${target.className} - ${event.type}`);
      let response = Continuation.Continue;
      if (event.type == 'mouseover') {
        if (this.disableContextMenu) {
          document.body.oncontextmenu = () => {
            return false;
          };
        }
        response.replace(this.onOver.call(this, event, this.mousePosition));
      } else if (event.type == 'mouseout') {
        response.replace(this.onOut.call(this, event, this.mousePosition));
        if (this.disableContextMenu) {
          document.body.oncontextmenu = null;
        }
      }
      return response;
    } catch (ex) {
      log.error(ex, 'event handler for ', this.typeName, ' failed');
    }
  }
}

export default {
  BuildMouseOverHandler,
  MouseOverHandlerBuilder,
  MouseOverHandler
};
