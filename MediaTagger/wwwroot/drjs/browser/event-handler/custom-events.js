import { LOG_LEVEL, Logger } from "../../logger.js";
import { default as dom } from "../dom.js";
import { EventHandler, EventHandlerBuilder } from "./handler.js";
import { ObjectEventType, HandlerMethod, HandlerResponse } from "./common.js";
import { OnNextLoop } from "../timer.js";
export * from "./common.js";

const log = Logger.create("CustomEvents", LOG_LEVEL.WARN);

export class EventListener extends EventHandler {
  constructor(objectEventType, ...args) {
    super(objectEventType, dom.getBody(), ...args);
    this.defaultResponse = HandlerResponse.Continue;
    this.listen();
  }

  callHandler(method, event) {
    const detail = event.detail;
    method.call(detail.data, detail.object, detail.type);
  }
}

export class ObjectListener extends EventHandler {
  constructor(obj, objectEventType, ...args) {
    super(objectEventType, dom.getBody(), ...args);
    this.target = obj;
    this.listen();
  }

  callHandler(method, event) {
    const detail = event.detail;
    if (
      (this.target == null || this.target == detail.object) &&
      (this.typeName == null ||
        this.typeName == "*" ||
        this.typeName == detail.typeName)
    ) {
      method.call(detail.object, detail.data, detail.type);
    }
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

export class EventEmitter {
  constructor(type, object) {
    this.type = type;
    if (type instanceof ObjectEventType) {
      this.typeName = type.getName();
    } else {
      this.typeName = type;
    }
    this.object = object;
    // todo: handle removing listeners and listener count
    this.hasListener = false;
  }

  createListener(handlerObject, handlerMethod) {
    log.debug(`EventEmitter.createListener ${this.typeName}`);
    var listener = new ObjectListener(this.object, this.type);
    listener.setHandler(new HandlerMethod(handlerObject, handlerMethod));
    this.hasListener = true;
    return listener;
  }

  emit(data) {
    if (!this.hasListener) {
      return;
    }
    const detail = {
      object: this.object,
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
    if (!this.hasListener) {
      return;
    }
    const detail = {
      object: this.object,
      data: data,
      typeName: this.typeName,
      type: this.type,
    };
    const event = new CustomEvent(this.typeName, { detail: detail });
    dom.getBody().dispatchEvent(event);
  }
}

export default { EventEmitter, EventListener, ObjectListener };
