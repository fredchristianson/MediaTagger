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
    return this.filteredEvent;
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

export class ObservableArray extends ObservableCollection {
  constructor(items = []) {
    super();
    if (items instanceof ObservableCollection) {
      this.items = [...items];
    } else if (Array.isArray(items)) {
      this.items = items;
    } else {
      throw new Error(
        "ObservableArray parameter must be an ObservableCollection or Array"
      );
    }
  }

  clear() {
    this.items = [];
    this.updatedEvent.emit(this.items);
  }

  find(selector) {
    return this.items.find(selector);
  }

  getLength() {
    return this.items.length;
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

  insert(item) {
    this.items.push(item);
    this.itemsAddedEvent.emit(item);
    this.updatedEvent.emit(this.items);
  }

  insertOnce(item) {
    if (!this.contains(item)) {
      this.insert(item);
    }
  }

  indexOf(item) {
    for (var i = 0; i < this.items.length; i++) {
      if (this.items[i] == item) {
        return i;
      }
    }
    return null;
  }

  remove(item) {
    var idx = this.indexOf(item);
    if (idx != null) {
      var item = this.items.splice(idx, 1);
      this.itemsRemovedEvent.emit(item);
      this.updatedEvent.emit(this.items);
    }
    return null;
  }

  contains(item) {
    var found = this.items.find((i) => {
      return i == item;
    });
    return found != null;
  }

  getById(id) {
    return this.items.find((item) => {
      return id == item.getId();
    });
  }
  // these are intended for other ObservableCollection instances, not public
  __getItems() {
    return this.items;
  }
  __sort(func) {
    this.items.sort(func);
  }
  __filter(func) {
    this.items = this.items.filter(func);
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
    this.collectionIn = null;
    this.listeners = null;
    this.setCollection(collectionIn);
  }

  onBaseSorted() {
    this.sortedEvent.emit(this);
    this.updatedEvent.emit(this);
  }

  onBaseFiltered() {
    this.filteredEvent.emit(this);
    this.updatedEvent.emit(this);
  }
  onBaseItemsAdded() {
    this.itemsAddedEvent.emit(this);
    this.updatedEvent.emit(this);
  }
  onBaseItemsRemoved() {
    this.itemsRemovedEvent.emit(this);
    this.updatedEvent.emit(this);
  }
  onBaseUpdated() {
    this.updatedEvent.emit(this);
  }

  clear() {
    this.collectionIn.clear();
  }
  insert(item) {
    this.collectionIn.insert(item);
  }

  insertOnce(item) {
    this.collectionIn.insertOnce(item);
  }

  contains(item) {
    return this.collectionIn.contains(item);
  }

  remove(item) {
    return this.collectionIn.remove(item);
  }
  indexOf(item) {
    return this.collectionIn.indexOf(item);
  }

  find(selectorFunc) {
    return this.collectionIn.find(selectorFunc);
  }

  getById(id) {
    return this.collectionIn.getById(id);
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

  setCollection(collectionIn) {
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
    if (this.listeners) {
      this.listeners.removeAll();
    }
    this.listeners = new Listeners(
      this.collectionIn.getSortedEvent().createListener(this, "onBaseSorted"),
      this.collectionIn
        .getFilteredEvent()
        .createListener(this, "onBaseFiltered"),
      this.collectionIn
        .getItemsAddedEvent()
        .createListener(this, "onBaseItemsAdded"),
      this.collectionIn
        .getItemsRemovedEvent()
        .createListener(this, "onBaseItemsRemoved"),
      this.collectionIn.getUpdatedEvent().createListener(this, "onBaseUpdated")
    );
    this.updatedEvent.emit(this);
  }
}

function defaultSortCompare(a, b) {
  if (a == null) {
    return b == null ? 0 : -1;
  }
  if (b == null) {
    return 1;
  }
  return a < b ? -1 : 1;
}

export class SortedObservableView extends ObservableView {
  constructor(collectionIn = null, comparisonFunction = defaultSortCompare) {
    super(collectionIn);
    this.comparisonFunction = comparisonFunction;
    this.sortedItems = new ObservableArray(collectionIn);
    this.sort();
  }

  setSortComparison(comparisonFunction) {
    this.comparisonFunction = comparisonFunction;
    this.sort();
  }
  onBaseUpdated() {
    this.sortedItems = new ObservableArray(this.collectionIn);
    this.sort();
  }

  getItemAt(index) {
    try {
      return this.sortedItems.getItemAt(index);
    } catch (ex) {
      return null;
    }
  }

  indexOf(item) {
    return this.sortedItems.indexOf(item);
  }

  getLength() {
    return this.sortedItems.getLength();
  }
  sort() {
    this.sortedItems.__sort(this.comparisonFunction);
    this.sortedEvent.emit(this);
    this.updatedEvent.emit(this);
  }
}

function defaultKeepFilter(item) {
  return true;
}

export class FilteredObservableView extends ObservableView {
  constructor(collectionIn = null, keepFunction = defaultKeepFilter) {
    super(collectionIn);
    this.keepFunction = keepFunction;
    this.filteredItems = new ObservableArray(collectionIn);
    this.filter();
  }

  setKeepFunction(keepFunction) {
    this.keepFunction = keepFunction;
    this.filter();
  }
  onBaseUpdated() {
    this.filter();
  }

  getItemAt(index) {
    try {
      return this.filteredItems.getItemAt(index);
    } catch (ex) {
      return null;
    }
  }

  indexOf(item) {
    return this.filteredItems.indexOf(item);
  }

  getLength() {
    return this.filteredItems.getLength();
  }
  filter() {
    this.filteredItems = new ObservableArray(this.collectionIn);
    this.filteredItems.__filter(this.keepFunction);
    this.filteredEvent.emit(this);
    this.updatedEvent.emit(this);
  }
}
