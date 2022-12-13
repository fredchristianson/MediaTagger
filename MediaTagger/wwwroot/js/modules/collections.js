import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import {
  EventEmitter,
  ObjectEventType,
  Listeners,
} from "../../drjs/browser/event.js";
import UTIL from "../../drjs/util.js";
const log = Logger.create("Collections", LOG_LEVEL.INFO);

var filteredEvent = new ObjectEventType("__collection-filtered");
var sortedEvent = new ObjectEventType("__collection-sorted");
var itemsAddedEvent = new ObjectEventType("__collection-itemsAdded");
var itemsRemovedEvent = new ObjectEventType("__collection-itemsRemoved");
var updatedEvent = new ObjectEventType("__collection-updated");

export class ObservableCollection {
  constructor() {
    this.sortedEvent = new EventEmitter(sortedEvent, this);
    this.filteredEvent = new EventEmitter(filteredEvent, this);
    this.itemsAddedEvent = new EventEmitter(itemsAddedEvent, this);
    this.itemsRemovedEvent = new EventEmitter(itemsRemovedEvent, this);
    this.updatedEvent = new EventEmitter(updatedEvent, this);
  }
  getSortedEvent() {
    return this.sortedEvent;
  }
  getFilteredEvent() {
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

  getEnumerator() {
    throw new Error("ObservableCollection class must implement getEnumerator");
  }
}

export class ObservableArray extends ObservableCollection {
  constructor(items = []) {
    super();
    this.items = items;
  }

  getLength() {
    return this.items.length;
  }
  getEnumerator() {
    return this.items.getEnumerator();
  }

  getItemAt(index) {
    if (this.items == null) return null;
    if (this.items.length - 1 < index) return null;
    return this.items[index];
  }

  setItems(items) {
    if (items instanceof ObservableCollection) {
      this.items = items.getItems();
    } else if (Array.isArray(items)) {
      this.items = items;
    } else if (items == null) {
      this.items = "";
    } else {
      throw new Error("ObservableArray.items called with invalid parameter");
    }
    this.updatedEvent.emit(this.items);
  }
}

// a ObservableList requires an ObservableCollection it accesses.
// ObservableLists can be chained.  For example
//    baseArray --> FilteredList --> SortedList --> ObservableList
// the final list in this chain is a filtered and sorted version of the base array.
// items added/removed in the base array will trigger events in every list in the chain
export class ObservableView extends ObservableCollection {
  constructor(collectionIn = null) {
    super();
    if (collectionIn == null) {
      throw new Error("ObservableList needs an input collection");
    }
    if (Array.isArray(collectionIn)) {
      collectionIn = new ObservableArray(collectionIn);
    }
    this.collectionIn = collectionIn;
    if (!(collectionIn instanceof ObservableCollection)) {
      throw new Error(
        "ObservableLView constructor argument is not a collection"
      );
    }
    this.collectionIn.getSortedEvent().createListener(this, "onBaseSorted");
    this.collectionIn.getFilteredEvent().createListener(this, "onBaseSorted");
    this.collectionIn
      .getItemsAddedEvent()
      .createListener(this, "onBaseItemsAdded");
    this.collectionIn
      .getItemsAddedEvent()
      .createListener(this, "onBaseItemsAddedEvent");
    this.collectionIn
      .getItemsRemovedEvent()
      .createListener(this, "onBaseItemsRemovedEvent");
    this.collectionIn.getUpdatedEvent().createListener(this, "onBaseUpdated");
  }

  getLength() {
    return this.collectionIn.getLength();
  }

  getItemAt(index) {
    try {
      return this.collectionIn.getItemAt(index);
    } catch (ex) {
      var count = 0;
    }
  }

  setCollection(collection) {
    if (items instanceof ObservableCollection) {
      this.collectionIn = collection;
      this.updatedEvent.emit(this);
    } else {
      throw new Error(
        "setCollection must be passed a valid ObservableCollection"
      );
    }
  }

  [Symbol.iterator]() {
    let index = 0;
    const count = this.getLength();
    return {
      next: () => {
        if (index < count) {
          return { done: false, value: this.getItemAt(index++) };
        } else {
          return { done: true };
        }
      },
    };
  }
}
