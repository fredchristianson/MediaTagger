import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import {
  EventEmitter,
  ObjectEventType,
  Listeners,
} from "../../drjs/browser/event.js";
import UTIL from "../../drjs/util.js";
const log = Logger.create("Collections", LOG_LEVEL.INFO);

var sortedEvent = new ObjectEventType("sorted");
var itemsAddedEvent = new ObjectEventType("itemsAdded");
var itemsRemovedEvent = new ObjectEventType("itemsRemoved");
var updatedEvent = new ObjectEventType("updated");

export class ObservableCollection {
  constructor() {
    this.sortedEvent = new EventEmitter(sortedEvent, this);
    this.itemsAddedEvent = new EventEmitter(itemsAddedEvent, this);
    this.itemsRemovedEvent = new EventEmitter(itemsRemovedEvent, this);
    this.updatedEvent = new EventEmitter(updatedEvent, this);
  }
  getSortedEvent() {
    return this.sortedEvent;
  }
  getItemsAddedEvent() {
    return this.itemsAddedEvent;
  }
  getItemsRemovedEvent() {
    return this.itemsRemovedEvent;
  }
  getUpdatedEvent() {
    log.debug("getUpdateEvent");
    return this.updatedEvent;
  }
  getItems() {
    throw new Error("ObservableCollection.getItems() not implemented");
  }
}

export class ObservableList extends ObservableCollection {
  constructor() {
    super();
    this.items = [];
  }

  getLength() {
    return this.items.length;
  }
  getItems() {
    return this.items;
  }

  getItem(index) {
    if (this.items == null) return null;
    if (this.items.length - 1 < index) return null;
    return this.items[index];
  }

  setItems(items) {
    if (items instanceof ObservableCollection) {
      this.items = items.getItems();
    } else {
      this.items = items;
    }
    this.updatedEvent.emit(this.items);
  }
}
