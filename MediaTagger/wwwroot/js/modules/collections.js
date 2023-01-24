import { LOG_LEVEL, Logger } from '../../drjs/logger.js';
import {
  EventEmitter,
  ObjectEventType,
  Listeners,
  BuildCustomEventHandler
} from '../../drjs/browser/event.js';
import { Assert } from '../../drjs/assert.js';
const log = Logger.create('Collections', LOG_LEVEL.INFO);

const filteredEvent = new ObjectEventType('__collection-filtered');
const sortedEvent = new ObjectEventType('__collection-sorted');
const itemsAddedEvent = new ObjectEventType('__collection-itemsAdded');
const itemsRemovedEvent = new ObjectEventType('__collection-itemsRemoved');
const updatedEvent = new ObjectEventType('__collection-updated');

let nextID = 1;
/*
 * all items in a collection should have a getId() method
 */
class ObservableCollection {
  constructor() {
    this._id = nextID++;
    log.never('Create collection ', this._id, this.constructor.name);
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
    log.debug('getUpdateEvent');
    return this.updatedEvent;
  }

  findById(id) {
    for (const item of this) {
      if (item.getId() == id) {
        return item;
      }
    }
    return null;
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
      }
    };
  }
}

class ObservableArray extends ObservableCollection {
  constructor(items = []) {
    super();
    if (items instanceof ObservableCollection) {
      this.items = [...items];
    } else if (Array.isArray(items)) {
      this.items = items;
    } else {
      throw new Error(
        'ObservableArray parameter must be an ObservableCollection or Array'
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

  get Length() {
    return this.items.length;
  }
  getLength() {
    return this.items.length;
  }

  getItemAt(index) {
    if (this.items == null) {
      return null;
    }
    if (this.items.length - 1 < index) {
      return null;
    }
    return this.items[index];
  }

  setItems(items) {
    if (items instanceof ObservableCollection) {
      this.items = items.getItems();
    } else if (Array.isArray(items)) {
      this.items = items;
    } else if (items == null) {
      this.items = '';
    } else {
      throw new Error('ObservableArray.items called with invalid parameter');
    }
    this.updatedEvent.emit(this.items);
  }

  // nothing for the collection to do, but listeners should be notified
  itemsChanged(items) {
    this.updatedEvent.emit(items);
  }
  insertBatch(newItems) {
    for (const item of newItems) {
      this.items.push(item);
    }
    this.itemsAddedEvent.emitNow(newItems);
    this.updatedEvent.emit(this.items);
  }
  insert(item) {
    this.items.push(item);
    this.itemsAddedEvent.emitNow(item);
    this.updatedEvent.emit(this.items);
  }

  insertOnce(item) {
    if (!this.contains(item)) {
      this.insert(item);
    }
  }

  indexOf(item) {
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i] == item) {
        return i;
      }
    }
    return null;
  }

  remove(item) {
    const idx = this.indexOf(item);
    if (idx != null) {
      const removed = this.items.splice(idx, 1);
      this.itemsRemovedEvent.emitNow(removed);
      this.updatedEvent.emit(this.removed);
      return item;
    }
    return null;
  }

  removeMatch(matchFunc) {
    for (let idx = 0; idx < this.getLength(); ) {
      const item = this.getItemAt(idx);
      if (matchFunc(item)) {
        this.remove(item);
      } else {
        idx++;
      }
    }
  }

  contains(item) {
    const found = this.items.find((i) => {
      return i == item;
    });
    return found != null;
  }

  findById(id) {
    return this.items.find((item) => {
      return id == item.getId();
    });
  }

  search(matchFunction) {
    return this.items.filter(matchFunction);
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

/*
 * a ObservableList requires an ObservableCollection it accesses.
 * ObservableLists can be chained.  For example
 *    baseArray --> FilteredList --> SortedList --> ObservableList
 * the final list in this chain is a filtered and sorted version of the base array.
 * items added/removed in the base array will trigger events in every list in the chain
 */
class ObservableView extends ObservableCollection {
  constructor(collectionIn = null) {
    super();
    this.collectionIn = null;
    this.listeners = null;
    this.setCollection(collectionIn);
  }

  onBaseSorted() {
    this.sortedEvent.emitNow(this);
  }

  onBaseFiltered() {
    this.filteredEvent.emitNow(this);
  }
  onBaseItemsAdded(item) {
    this.itemsAddedEvent.emitNow(item);
  }
  onBaseItemsRemoved(item) {
    this.itemsRemovedEvent.emitNow(item);
  }
  onBaseUpdated() {
    this.updatedEvent.emit(this);
  }

  clear() {
    this.collectionIn.clear();
  }
  insertBatch(newItems) {
    this.collectionIn.insertBatch(newItems);
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

  get Length() {
    return this.collectionIn.Length;
  }

  getLength() {
    return this.collectionIn.getLength();
  }

  getItemAt(index) {
    try {
      return this.collectionIn.getItemAt(index);
    } catch (ex) {
      return null;
    }
  }

  setCollection(collectionIn) {
    if (collectionIn == null) {
      throw new Error('ObservableList needs an input collection');
    }

    if (Array.isArray(collectionIn)) {
      this.collectionIn = new ObservableArray(collectionIn);
    } else {
      this.collectionIn = collectionIn;
    }
    if (!(collectionIn instanceof ObservableCollection)) {
      throw new Error(
        'ObservableLView constructor argument is not a collection'
      );
    }
    if (this.listeners) {
      this.listeners.removeAll();
    }
    this.listeners = new Listeners(
      BuildCustomEventHandler()
        .emitter(this.collectionIn.getSortedEvent())
        .onEvent(this, 'onBaseSorted')
        .build(),
      BuildCustomEventHandler()
        .emitter(this.collectionIn.getFilteredEvent())
        .onEvent(this, 'onBaseFiltered')
        .build(),
      BuildCustomEventHandler()
        .emitter(this.collectionIn.getItemsAddedEvent())
        .onEvent(this, 'onBaseItemsAdded')
        .build(),
      BuildCustomEventHandler()
        .emitter(this.collectionIn.getItemsRemovedEvent())
        .onEvent(this, 'onBaseItemsRemoved')
        .build(),
      BuildCustomEventHandler()
        .emitter(this.collectionIn.getUpdatedEvent())
        .onEvent(this, 'onBaseUpdated')
        .build()
    );
    this.updatedEvent.emit(this);
  }
}

export class SortedObservableView extends ObservableView {
  constructor(collectionIn = null, comparisonFunction = null) {
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
    /*
     *  sort() emited events
     * this.sortedEvent.emit(this.sortedItems);
     * this.updatedEvent.emit(this.updatedEvent);
     */
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

  get Length() {
    return this.sortedItems.Length;
  }

  getLength() {
    return this.sortedItems.getLength();
  }
  sort() {
    if (this.comparisonFunction == null) {
      return;
    }
    this.sortedItems.__sort(this.comparisonFunction);
    this.sortedEvent.emit(this);
    this.updatedEvent.emit(this);
  }
}

function defaultKeepFilter(_item) {
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

  findById(id) {
    return this.filteredItems.findById(id);
  }

  get Length() {
    return this.filteredItems.Length;
  }

  getLength() {
    return this.filteredItems.getLength();
  }
  filter() {
    if (this.keepFunction == null) {
      this.filteredItems = this.collectionIn;
      this.filteredEvent.emit(this);
      this.updatedEvent.emit(this);
      return;
    }
    this.filteredItems = new ObservableArray(this.collectionIn);
    this.filteredItems.__filter(this.keepFunction);
    this.filteredEvent.emit(this);
    this.updatedEvent.emit(this);
  }
}

/*
 *  expects items to have getId() and getParentId() methods.
 * getParentId() returns null for top-level node.
 */
export class ObservableTree extends ObservableArray {
  constructor() {
    super();
  }

  getTopNodes() {
    return [...this].filter((item) => {
      return item.getParentId() == null;
    });
  }

  getChildren(parent) {
    let parentId = parent;
    if (parent && typeof parent == 'object') {
      parentId = parent.getId();
    }
    return [...this].filter((item) => {
      return item.getParentId() == parentId;
    });
  }

  getChildByName(parent, name) {
    let parentId = parent;
    if (parent && typeof parent == 'object') {
      parentId = parent.getId();
    }
    return [...this].find((item) => {
      return item.getParentId() == parentId && item.getName() == name;
    });
  }
  // eslint-disable-next-line complexity
  getPath(path, divider = '/') {
    Assert.type(path, 'string', 'getPath() requires a string path');
    const levels = path.split(divider);
    let nodes = this.getTopNodes();
    let found = null;
    for (let idx = 0; idx < levels.length; idx++) {
      const level = levels[idx];
      const name = level.trim();
      if (nodes != null && name.length > 0) {
        const next = nodes.find((node) => {
          return (
            node.Name.localeCompare(name, undefined, {
              sensitivity: 'accent'
            }) == 0
          );
        });
        if (next == null) {
          return null;
        }
        found = next;
        nodes = this.getChildren(next);
      }
    }
    return found;
  }
}

export { ObservableCollection, ObservableArray, ObservableView };
