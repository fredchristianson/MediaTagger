import { Assert } from "../../drjs/assert.js";
import DOM from "../../drjs/browser/dom.js";
import { BuildClickHandler, Listeners } from "../../drjs/browser/event.js";
import { LOG_LEVEL, Logger } from "../../drjs/logger.js";

const log = Logger.create("DOMWatcher", LOG_LEVEL.WARN);
const observerConfig = {
  attributes: true,
  attributeOldValue: true,
  childList: true,
  subtree: true,
};

class WatchAction {
  constructor(selector, action) {
    Assert.notNull(selector, "WatchAction requires a selector");
    Assert.notNull(action, "WatchAction requires a selector");
    this.selector = selector;
    this.action = action;
    this.listeners = new Listeners();
    this.watchedElements = [];
  }

  getSelector() {
    return this.selector;
  }

  isMatch(element) {
    //return DOM.matches(element, this.selector);
    return (
      element != null &&
      element instanceof HTMLElement &&
      element.matches(this.selector)
    );
  }

  watchElement(element) {
    if (!this.watchedElements.includes(element)) {
      this.createEvents(element);
      this.newElement(element);
      this.watchedElements.push(element);
    } else {
      log.never("element added multiple times");
    }
  }

  unwatchElement(element) {
    var pos = this.watchedElements.indexOf(element);
    if (pos >= 0) {
      this.removeEvents(element);
      this.removeElement(element);

      this.watchedElements.splice(pos, 1);
    }
  }

  newElement(element) {}
  createEvents(element) {}

  removeEvents(element) {}
  removeElement(element) {}
  isAttributeMatch(name) {
    return false;
  }
}

export class NewElementWatcher extends WatchAction {
  constructor(selector, action) {
    super(selector, action);
  }
  newElement(element) {
    this.action(element);
  }
}

class ClickAction extends WatchAction {
  constructor(selector, action) {
    super(selector, action);
  }
  createEvents(element) {
    this.listeners.add(
      BuildClickHandler().listenTo(element).onClick(this, this.clicked).build()
    );
  }

  clicked(element) {
    this.action(element);
  }
}

export class AttributeChangeAction extends WatchAction {
  constructor(attrName, selector, action) {
    super(selector, action);
    this.attrName = attrName;
  }

  changed(element, attributeName, oldValue) {
    this.action(element, attributeName, oldValue, element[attributeName]);
  }
  isAttributeMatch(name) {
    return name == this.attrName;
  }
}

export class ClassChangeAction extends AttributeChangeAction {
  constructor(selector, action) {
    super("class", selector, action);
  }
  changed(element, attributeName, oldValue) {
    this.action(element, oldValue, element.className);
  }
}

export class StyleChangeAction extends AttributeChangeAction {
  constructor(selector, action) {
    super("style", selector, action);
  }
}

export class DOMWatcher {
  constructor(domRoot = document.body) {
    this.observer = new MutationObserver(this.onMutation.bind(this));
    this.observer.observe(DOM.first(domRoot), observerConfig);
    this.actions = [];
  }

  addAction(action) {
    this.actions.push(action);
  }
  addClickAction(selector, action) {
    log.debug("watch: ", selector);
    this.actions.push(new ClickAction(selector, action));
    // do a search for existing element matches
    this.elementAdded(DOM.find(selector));
  }

  onMutation(mutationList) {
    log.debug("mutation");
    for (var mutation of mutationList) {
      if (mutation.type == "attributes") {
        this.attributeChanged(mutation);
      } else if (mutation.type == "childList") {
        mutation.addedNodes.forEach((e) => this.elementAdded(e));
        mutation.removedNodes.forEach((e) => this.elementRemoved(e));
      } else {
        log.warn("unknown mutation type ", mutation.type);
      }
    }
  }

  attributeChanged(mutation) {
    log.debug(
      `attr change ${mutation.target.id}:${mutation.target.className} @${
        mutation.target.attributeName
      } ${mutation.oldValue}->${mutation.target[mutation.attributeName]}`
    );
    const element = mutation.target;
    const attr = mutation.attributeName;
    this.actions.forEach((action) => {
      if (action.isAttributeMatch(attr)) {
        const matches = DOM.find(element, action.selector);
        matches.forEach((match) => {
          action.changed(match, mutation.attributeName, mutation.oldValue);
        });
      }
    });
  }
  elementAdded(element) {
    if (Array.isArray(element)) {
      element.forEach((e) => {
        this.elementAdded(element);
      });
    }
    // ignore TEXT nodes
    if (!(element instanceof HTMLElement)) {
      return;
    }
    log.debug("check element: ", element.id, element.className);
    this.actions.forEach((action) => {
      var matches = DOM.find(element, action.selector);
      matches.forEach((match) => {
        action.watchElement(match);
      });
    });
  }

  elementRemoved(element) {
    if (!(element instanceof HTMLElement)) {
      return;
    }
    this.actions.forEach((action) => {
      if (action.isMatch(element)) {
        action.unwatchElement(element);
      }
    });
  }
}

export function toggleClass(className) {
  return function (element) {
    DOM.toggleClass(element, className);
  };
}

export default DOMWatcher;
