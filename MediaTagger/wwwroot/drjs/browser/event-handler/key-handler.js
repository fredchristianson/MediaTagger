import { Assert } from "../../assert.js";
import { LOG_LEVEL, Logger } from "../../logger.js";
import { default as dom } from "../dom.js";
import {
  EventHandlerBuilder,
  EventHandler,
  EventHandlerReturn,
  HandlerMethod,
} from "./handler.js";

const log = Logger.create("KeyHandler", LOG_LEVEL.WARN);

class KeyMatch {
  static get Enter() {
    return new Key("Enter");
  }
  static get Escape() {
    return new Key("Escape");
  }

  static Shift(key) {
    return new Key(key).shift(true);
  }
  static Control(key) {
    return new Key(key).control(true);
  }
  static Alt(key) {
    return new Key(key).alt(true);
  }

  constructor(key) {
    Assert.notNull(key, "KeyMatch requires a non-null key");
    this.key = key.toLowerCase();
    this.withShift = false;
    this.withControl = false;
    this.withAlt = false;
    // response if handled and handler doesn't have a response
    this.defaultResponse = EventHandlerReturn.StopAll;
  }

  isMatch(event) {
    if (this.withAlt && !event.hasAlt) {
      return false;
    }
    if (this.withControl && !event.hasCtrl) {
      return false;
    }
    if (this.withAlt && !event.hasAlt) {
      return false;
    }
    return this.key == event.key.toLowerCase();
  }

  shift(has = true) {
    this.withShift = has;
    return this;
  }
  control(has = true) {
    this.withControl = has;
    return this;
  }
  alt(has = true) {
    this.withAlt = has;
    return this;
  }
}

function Key(key) {
  return new KeyMatch(key);
}
Key.Enter = KeyMatch.Enter;
Key.Escape = KeyMatch.Escape;
Key.Shift = function (key) {
  return Key(key).shift(true);
};
Key.Control = function (key) {
  return Key(key).control(true);
};
Key.Alt = function (key) {
  return Key(key).alt(true);
};

function BuildKeyHandler() {
  return new KeyHandlerBuilder();
}

class KeyHandlerBuilder extends EventHandlerBuilder {
  constructor(type) {
    super(type || KeyHandler);
  }

  onKeyDown(...args) {
    this.handlerInstance.setOnKeyDown(new HandlerMethod(...args, "onKeyDown"));
    return this;
  }
  onKeyUp(...args) {
    this.handlerInstance.setOnKeyUp(new HandlerMethod(...args, "onKeyUp"));
    return this;
  }
  onEnter(...args) {
    this.handlerInstance.setOnKey(
      Key.Enter,
      new HandlerMethod(...args, "onEnter")
    );
    return this;
  }
  onEscape(...args) {
    this.handlerInstance.setOnKey(
      Key.Escape,
      new HandlerMethod(...args, "onEscape")
    );
    return this;
  }
  onKey(key, ...args) {
    if (!(key instanceof KeyMatch)) {
      key = Key(key);
    }

    this.handlerInstance.setOnKey(key, new HandlerMethod(...args, "onKey"));
    return this;
  }
}

class KeyMatchHandler {
  constructor(keyMatch, handler) {
    Assert.notNull(keyMatch, "KeyMatchHandler requires a KeyMatch");
    Assert.type(
      keyMatch,
      KeyMatch,
      "keyMatch parameter is not a KeyMatch instance"
    );
    Assert.notNull(handler, "KeyMatchHandler requires a handler method");
    this.keyMatch = keyMatch;
    this.handlerMethod = handler;
  }
  handleEvent(event, keyHandler) {
    if (this.keyMatch.isMatch(event)) {
      this.handlerMethod.setData(keyHandler.dataSource, keyHandler.data);
      var response = this.keyMatch.defaultResponse.clone();
      response.replace(
        this.handlerMethod.call(
          event.key,
          keyHandler.getEventTarget(event),
          event
        )
      );
      return response;
    }
  }
}

class KeyHandler extends EventHandler {
  constructor(...args) {
    super(...args);
    this.setTypeName(["keydown", "keyup"]);
    this.setDefaultResponse(EventHandlerReturn.Continue);
    this.onKeyDown = HandlerMethod.None();
    this.onKeyUp = HandlerMethod.None();
    this.keyHandlers = [];
  }

  setOnKeyDown(handler) {
    this.onKeyDown = handler;
  }
  setOnKeyUp(handler) {
    this.onKeyUp = handler;
  }

  setOnKey(key, handler) {
    this.keyHandlers.push(new KeyMatchHandler(key, handler));
  }

  callHandler(method, event) {
    try {
      var response = EventHandlerReturn.Continue;
      var target = this.getEventTarget(event);
      if (event.type == "keydown") {
        this.onKeyDown.setData(this.dataSource, this.data);
        response.replace(this.onKeyDown.call(event.key, target, event));
      } else if (event.type == "keyup") {
        this.onKeyUp.setData(this.dataSource, this.data);
        response.replace(this.onKeyUp.call(event.key, target, event));
      }
      this.keyHandlers.forEach((kh) => {
        response.combine(kh.handleEvent(event, this));
      });
      return response;
    } catch (ex) {
      log.error(ex, "event handler for ", this.typeName, " failed");
    }
  }
  getValue(element) {
    return dom.getValue(element);
  }
}

export { Key, KeyMatch, KeyHandlerBuilder, BuildKeyHandler, KeyHandler };
