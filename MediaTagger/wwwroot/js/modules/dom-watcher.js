import DOM from "../../drjs/browser/dom.js";
import { BuildClickHandler, Listeners } from "../../drjs/browser/event.js";
import { LOG_LEVEL, Logger } from "../../drjs/logger.js";

const log = Logger.create("DOMWatcher", LOG_LEVEL.WARN);
const observerConfig = { attributes: false, childList: true, subtree: true };

class WatchAction {
  constructor(selector, action) {
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
      this.watchedElements.push(element);
    } else {
      log.warn("element added multiple times");
    }
  }

  unwatchElement(element) {
    var pos = this.watchedElements.indexOf(element);
    if (pos >= 0) {
      this.removeEvents(element);
      this.watchedElements.splice(pos, 1);
    }
  }

  createEvents(element) {}

  removeEvents(element) {}
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

export class DOMWatcher {
  constructor(domRoot = document.body) {
    this.observer = new MutationObserver(this.onMutation.bind(this));
    this.observer.observe(DOM.first(domRoot), observerConfig);
    this.actions = [];
  }

  addAction(selector, action) {}
  addClickAction(selector, action) {
    log.debug("watch: ", selector);
    this.actions.push(new ClickAction(selector, action));
    // do a search for existing element matches
    this.elementAdded(DOM.find(selector));
  }

  onMutation(mutationList) {
    log.debug("mutation");
    for (var mutation of mutationList) {
      mutation.addedNodes.forEach((e) => this.elementAdded(e));
      mutation.removedNodes.forEach((e) => this.elementRemoved(e));
    }
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
