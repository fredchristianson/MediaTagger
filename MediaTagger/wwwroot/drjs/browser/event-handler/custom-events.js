import { LOG_LEVEL, Logger } from "../../logger.js";
import { default as dom } from "../dom.js";
import { EventListener, EventHandlerBuilder } from "./handler.js";
import { ObjectEventType, HandlerMethod, Continuation } from "./common.js";
import { OnNextLoop } from "../timer.js";
export * from "./common.js";

const log = Logger.create("CustomEvents", LOG_LEVEL.WARN);

function BuildCustomEventHandler() {
  return new CustomEventHandlerBuilder();
}

class CustomEventHandlerBuilder extends EventHandlerBuilder {
  constructor() {
    super(CustomEventHandler);
  }

  // set the type (string) of event to listen to or list of types
  setEventType(type) {
    this.handlerInstance.setEventType(type);
    return this;
  }
  // only listen to events from specific sender or list of senders
  setSender(object) {
    this.handlerInstance.setSender(object);
    return this;
  }

  emitter(emit) {
    this.handlerInstance.setType(emit.Type);
    this.handlerInstance.setSender(emit.Sender);
    return this;
  }

  onEvent(...args) {
    this.handlerInstance.addOnEvent(...args);
    return this;
  }
}

class CustomEventHandler extends EventListener {
  constructor() {
    super();
    this.sender = null;
    this.type = null;
    this.onEvent = [];
  }

  setSender(sender) {
    this.sender = sender;
  }

  setType(type) {
    this.type = type;
    if (type instanceof ObjectEventType) {
      this.typeName = type.Name;
    } else {
      this.typeName = type;
    }
  }

  addOnEvent(...args) {
    this.onEvent.push(HandlerMethod.Of(...args));
  }

  async callHandlers(event) {
    const detail = event.detail;
    var continuation = this.DefaultContinuation;
    if (this.matchSender(detail) && this.matchType(detail)) {
      for (var onEventHandler of this.onEvent) {
        continuation.combine(
          onEventHandler.call(
            this,
            event,
            detail.data,
            detail.sender,
            detail.type
          )
        );
        if (
          continuation.StopPropagation &&
          continuation.StopPropagationImmediate
        ) {
          break;
        }
      }
    }
  }

  matchSender(detail) {
    if (this.sender == null) {
      return true;
    } else if (Array.isArray(this.sender)) {
      return this.sender.includes(detail.sender);
    }
    return this.sender == detail.sender;
  }

  matchType(detail) {
    if (this.type == null) {
      return true;
    } else if (Array.isArray(this.type)) {
      return this.type.includes(detail.type);
    }
    return this.typeName == detail.typeName;
  }
}

class AsyncEventDispatcher {
  constructor() {
    this.queue = null;
  }

  schedule(typeName, details) {
    if (this.queue == null) {
      this.queue = [];
      // schedule dispatch on next loop
      OnNextLoop(() => {
        this.dispatchEvents();
      });
    }
    this.queue.push({ typeName, details });
  }
  dispatchEvents() {
    if (this.queue == null) {
      return;
    }
    var todo = this.queue;
    this.queue = null;
    while (todo.length > 0) {
      const def = todo.shift();
      const event = new CustomEvent(def.typeName, { detail: def.details });
      log.info("dispatch ", def);
      dom.getBody().dispatchEvent(event);
    }
  }
  isScheduled(typeName, detailsMatchFunction) {
    if (this.queue == null) {
      return false;
    }
    return this.queue.find((def) => {
      return def.typeName == typeName && detailsMatchFunction(def.details);
    });
  }
}

const asyncDispatcher = new AsyncEventDispatcher();

class EventEmitter {
  constructor(typeName, sender = null) {
    this.type = typeName;
    this.typeName =
      typeName instanceof ObjectEventType ? typeName.Name : typeName;

    this.sender = sender;
  }

  get Type() {
    return this.type;
  }

  get TypeName() {
    return this.typeName;
  }
  get Sender() {
    return this.sender;
  }
  // events are emitted at the next javascript loop, and only one event is
  // dispatched for any data.
  //
  // Use emitNow() to send immediately
  emit(data) {
    const detail = {
      sender: this.sender,
      data: data,
      typeName: this.typeName,
      type: this.type,
    };
    log.debug(`EventEmitter.emit ${this.typeName}`);
    if (
      !asyncDispatcher.isScheduled(this.typeName, (details) => {
        return details.data == data;
      })
    ) {
      asyncDispatcher.schedule(this.typeName, detail);
    }
  }

  emitNow(data) {
    const detail = {
      sender: this.sender,
      data: data,
      typeName: this.typeName,
      type: this.type,
    };
    const event = new CustomEvent(this.typeName, { detail: detail });
    dom.getBody().dispatchEvent(event);
  }
}

export {
  EventEmitter,
  EventListener,
  BuildCustomEventHandler,
  CustomEventHandler,
  CustomEventHandlerBuilder,
};
