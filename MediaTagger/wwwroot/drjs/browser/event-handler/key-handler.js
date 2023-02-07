import { Assert } from '../../assert.js';
import { LOG_LEVEL, Logger } from '../../logger.js';
import { default as dom } from '../dom.js';
import {
  EventHandlerBuilder,
  EventListener,
  Continuation,
  HandlerMethod
} from './handler.js';

const log = Logger.create('KeyHandler', LOG_LEVEL.WARN);

class KeyMatch {
  static get Enter() {
    return new Key('Enter');
  }
  static get Escape() {
    return new Key('Escape');
  }
  static get Home() {
    return new Key('Home');
  }
  static get End() {
    return new Key('End');
  }
  static get LeftArrow() {
    return new Key('ArrowLeft');
  }
  static get RightArrow() {
    return new Key('ArrowRight');
  }
  static get UpArrow() {
    return new Key('ArrowUp');
  }
  static get DownArrow() {
    return new Key('ArrowDown');
  }
  static get Tab() {
    return new Key('Tab');
  }
  static get Space() {
    return new Key(' ');
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
    Assert.notNull(key, 'KeyMatch requires a non-null key');
    if (typeof key == 'string') {
      this.key = key;
      this.lowerCaseKey = key.toLowerCase();
    }
    this.requireShift = false;
    this.requireControl = false;
    this.requireAlt = false;
    this.noShift = false;
    this.noControl = false;
    this.noAlt = false;
    // response if handled and handler doesn't have a response
    this.defaultResponse = Continuation.StopAll;
  }

  isMatch(event) {
    if (this.requireAlt && !event.hasAlt) {
      return false;
    }
    if (this.requireControl && !event.hasCtrl) {
      return false;
    }
    if (this.requireShift && !event.hasShift) {
      return false;
    }
    if (this.noAlt && event.hasAlt) {
      return false;
    }
    if (this.noControl && event.hasCtrl) {
      return false;
    }
    if (this.noShift && event.hasShift) {
      return false;
    }
    return this.matchKey(event.key);
  }

  matchKey(key) {
    return this.lowerCaseKey == key.toLowerCase();
  }

  clone() {
    const copy = new KeyMatch(this.key);
    copy.requireShift = this.requireShift;
    copy.requireControl = this.requireControl;
    copy.requireAlt = this.requireAlt;
    copy.noShift = this.noShift;
    copy.noControl = this.noControl;
    copy.noAlt = this.noAlt;
    return copy;
  }

  withShift(has = true) {
    let copy = this.clone();
    copy.requireShift = has;
    copy.noShift = !has;
    return copy;
  }
  withCtrl(has = true) {
    let copy = this.clone();
    copy.requireControl = has;
    copy.noControl = !has;
    return copy;
  }
  withAlt(has = true) {
    let copy = this.clone();
    copy.requireAlt = has;
    copy.noAlt = !has;
    return copy;
  }
  withoutShift(has = true) {
    let copy = this.clone();
    copy.noShift = has;
    copy.requireShift = !has;
    return copy;
  }
  withoutCtrl(has = true) {
    let copy = this.clone();
    copy.noControl = has;
    copy.requireControl = !has;
    return copy;
  }
  withoutAlt(has = true) {
    let copy = this.clone();
    copy.noAlt = has;
    copy.requireAlt = !has;
    return copy;
  }
}

class RegexKeyMatch extends KeyMatch {
  constructor(regex) {
    super(regex);
    this.regex = regex;
    // alt and control must be explicitly set
    this.noAlt = true;
    this.noControl = true;
  }

  matchKey(key) {
    // only match single-letter keys. "Shift", "Arrow...", don't match
    return key != null && key.length == 1 && this.regex.test(key);
  }

  clone() {
    const copy = new RegexKeyMatch(this.regex);
    copy.requireShift = this.requireShift;
    copy.requireControl = this.requireControl;
    copy.requireAlt = this.requireAlt;
    copy.noShift = this.noShift;
    copy.noControl = this.noControl;
    copy.noAlt = this.noAlt;
    return copy;
  }
}

function Key(key) {
  return new KeyMatch(key);
}
Key.Enter = KeyMatch.Enter;
Key.Escape = KeyMatch.Escape;
Key.UpArrow = KeyMatch.UpArrow;
Key.DownArrow = KeyMatch.DownArrow;
Key.LeftArrow = KeyMatch.LeftArrow;
Key.RightArrow = KeyMatch.RightArrow;
Key.Home = KeyMatch.Home;
Key.End = KeyMatch.End;
Key.Tab = KeyMatch.Tab;
Key.Space = KeyMatch.Space;
Key.Regex = function (regex) {
  return new RegexKeyMatch(regex);
};
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
    this.handlerInstance.setOnKeyDown(new HandlerMethod(...args, 'onKeyDown'));
    return this;
  }
  onKeyUp(...args) {
    this.handlerInstance.setOnKeyUp(new HandlerMethod(...args, 'onKeyUp'));
    return this;
  }
  onEnter(...args) {
    this.handlerInstance.setOnKey(
      Key.Enter,
      new HandlerMethod(...args, 'onEnter')
    );
    return this;
  }
  onEscape(...args) {
    this.handlerInstance.setOnKey(
      Key.Escape,
      new HandlerMethod(...args, 'onEscape')
    );
    return this;
  }
  onKey(key, ...args) {
    if (!(key instanceof KeyMatch)) {
      key = Key(key);
    }

    this.handlerInstance.setOnKey(key, new HandlerMethod(...args, 'onKey'));
    return this;
  }
  // only handle keys if document.activeElement is what is being listened to.
  //
  ifActive(requireActive = true) {
    this.handlerInstance.onlyActiveElement(requireActive);
    return this;
  }
}

class KeyMatchHandler {
  constructor(keyMatch, handler) {
    Assert.notNull(keyMatch, 'KeyMatchHandler requires a KeyMatch');
    Assert.type(
      keyMatch,
      KeyMatch,
      'keyMatch parameter is not a KeyMatch instance'
    );
    Assert.notNull(handler, 'KeyMatchHandler requires a handler method');
    this.keyMatch = keyMatch;
    this.handlerMethod = handler;
  }
  handleEvent(event, keyHandler) {
    if (this.match(event)) {
      let response = this.keyMatch.defaultResponse.clone();
      response.replace(this.handlerMethod.call(keyHandler, event, event.key));
      return response;
    }
  }
  match(event) {
    return this.keyMatch.isMatch(event);
  }
}

class KeyHandler extends EventListener {
  constructor(...args) {
    super(...args);
    this.setTypeName(['keydown', 'keyup']);
    this.setDefaultContinuation(Continuation.Continue);
    this.onKeyDown = HandlerMethod.None;
    this.onKeyUp = HandlerMethod.None;
    this.keyHandlers = [];
    this.requireActiveElement = false;
  }

  onlyActiveElement(requireActiveElement) {
    this.requireActiveElement = requireActiveElement;
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

  callHandlers(event) {
    try {
      if (
        this.requireActiveElement &&
        document.activeElement != this.listenElement
      ) {
        return;
      }
      // if there are not matches, continue
      let noMatchResponse = Continuation.Continue;
      let matchResponse = this.DefaultContinuation;
      let hasMatch = false;
      let target = this.getEventTarget(event);
      if (event.type == 'keydown') {
        noMatchResponse.replace(this.onKeyDown.call(this, event, event.key));
        this.keyHandlers.forEach((kh) => {
          hasMatch = hasMatch || kh.match(event);
          matchResponse.combine(kh.handleEvent(event, this));
        });
      } else if (event.type == 'keyup') {
        noMatchResponse.replace(this.onKeyUp.call(this, event, event.key));
      }

      return hasMatch ? matchResponse : noMatchResponse;
    } catch (ex) {
      log.error(ex, 'event handler for ', this.typeName, ' failed');
    }
  }
  getValue(element) {
    return dom.getValue(element);
  }
}

export { Key, KeyMatch, KeyHandlerBuilder, BuildKeyHandler, KeyHandler };
