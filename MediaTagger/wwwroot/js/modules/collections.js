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
    this.collectionIn.getFilteredEvent().createListener(this, "onBaseFiltered");
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
    this.items = new ObservableArray(collectionIn);
    this.sort();
  }

  setSortComparison(comparisonFunction) {
    this.comparisonFunction = comparisonFunction;
  }
  onBaseUpdated() {
    this.items = new ObservableArray(collectionIn);
    this.sort();
  }

  sort() {
    this.items.__sort(this.comparisonFunction);
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
    this.items = new ObservableArray(collectionIn);
    this.filter();
  }

  setKeepFunction(keepFunction) {
    this.keepFunction = keepFunction;
  }
  onBaseUpdated() {
    this.filter();
  }

  filter() {
    this.items = new ObservableArray(this.collectionIn);
    this.items.__filter(this.keepFunction);
    this.filteredEvent.emit(this);
    this.updatedEvent.emit(this);
  }
}
