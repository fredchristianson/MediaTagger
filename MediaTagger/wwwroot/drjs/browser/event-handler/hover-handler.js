import { LOG_LEVEL, Logger } from '../../logger.js';
import { EventHandlerBuilder, EventListener } from './handler.js';
import { Continuation, MousePosition, HandlerMethod } from './common.js';
import dom from '../dom.js';
import util from '../../util.js';
import { CancelToken, Task } from '../task.js';
const log = Logger.create('HoverHandler', LOG_LEVEL.WARN);

export function BuildHoverHandler() {
  return new HoverHandlerBuilder();
}

export class HoverHandlerBuilder extends EventHandlerBuilder {
  constructor() {
    super(HoverHandler);
  }

  onStart(...args) {
    this.handlerInstance.onStart = HandlerMethod.Of(...args, 'onHoverStart');
    return this;
  }
  onEnd(...args) {
    this.handlerInstance.onEnd = HandlerMethod.Of(...args, 'onHoverEnd');
    return this;
  }
  startDelayMSecs(msecs) {
    this.handlerInstance.startDelayMSecs = msecs;
    return this;
  }
  endDelayMSecs(msecs) {
    this.handlerInstance.endDelayMSecs = msecs;
    return this;
  }
  include(selectors) {
    this.handlerInstance.includeSelectors = selectors;
    super.selector(
      util
        .toArray(this.handlerInstance.hoverSelectors)
        .concat(util.toArray(this.handlerInstance.includeSelectors))
    );
    return this;
  }
  selector(selectors) {
    this.handlerInstance.hoverSelectors = selectors;
    super.selector(
      util
        .toArray(this.handlerInstance.hoverSelectors)
        .concat(util.toArray(this.handlerInstance.includeSelectors))
    );
    return this;
  }
}

export class HoverHandler extends EventListener {
  constructor(...args) {
    super(...args);
    this.setTypeName(['mousemove', 'mouseout']);
    this.setDefaultContinuation(Continuation.Continue);
    this.startDelayMSecs = 200;
    this.endDelayMSecs = 200;
    this.onStart = HandlerMethod.None;
    this.onEnd = HandlerMethod.None;
    this.includeSelectors = null;
    this.mousePosition = new MousePosition();
    this.inHover = false;
    this.startCancel = new CancelToken();
    this.endCancel = new CancelToken();
    this.currentTarget = null;
  }

  callStart(event) {
    this.onStart.call(this, event);
  }
  callEnd(event) {
    this.onEnd.call(this, event);
  }
  start(event, target, data) {
    if (this.inHover) {
      log.debug('no start - already hovering');
      return;
    }
    this.inHover = true;
    this.currentTarget = target;
    this.currentData = data;
    this.endCancel.cancel();
    this.startCancel.cancel();

    log.debug('start task delayed ', this.startDelayMSecs);
    this.startCancel = Task.Delay(this.startDelayMSecs, () => {
      log.debug('call onStart');
      this.callStart(event);
    });
  }

  end(event) {
    if (!this.inHover) {
      return;
    }

    this.endCancel.cancel();
    this.endCancel = Task.Delay(this.endDelayMSecs, () => {
      this.startCancel.cancel();
      this.inHover = false;
      this.callEnd(event);
    });
  }
  callHandlers(event) {
    this.mousePosition.update(event);

    try {
      let target = this.getEventTarget(event);
      log.debug(`hover: ${target.tagName} ${target.className} - ${event.type}`);
      let response = Continuation.Continue;
      if (event.type == 'mousemove') {
        if (this.selector == null || dom.matches(target, this.selector)) {
          this.endCancel.cancel();
          if (this.inHover && this.currentTarget == target) {
            return;
          }
          if (this.inHover && this.currentTarget != target) {
            log.debug('force end of old hover');
            this.callEnd(event);
            this.currentTarget = null;
            this.inHover = false;
          }
          log.debug('start hover delay');
          this.start(event, target, this.data);
        } else if (
          this.includeSelectors != null &&
          dom.matches(target, this.includeSelectors)
        ) {
          this.endCancel.cancel();
          log.debug('ignore move - includeSelectors match');
        } else {
          this.end(event);
        }
      } else if (event.type == 'mouseout') {
        if (!dom.matches(event.toElement, this.selector)) {
          this.end(event);
        } else {
          log.debug('mouse out to included element');
        }
      }
      return response;
    } catch (ex) {
      log.error(ex, 'event handler for ', this.typeName, ' failed');
    }
  }
}

export default {
  BuildHoverHandler,
  HoverHandlerBuilder,
  HoverHandler
};
