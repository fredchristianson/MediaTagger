import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import { compareDates, compareIds, compareNames } from "../data/helpers.js";
import {
  Tag,
  Property,
  PropertyValue,
  MediaFile,
  Album,
} from "../data/items.js";
import { runParallel, runSerial } from "./task.js";
import { dataAdder, dataLoader, dataUpdater } from "../data/data-loader.js";
import {
  ObservableView,
  SortedObservableView,
  FilteredObservableView,
  ObservableArray,
} from "./collections.js";
import {
  getMediaFiles,
  getProperties,
  getPropertyValues,
  getTags,
  getAlbums,
} from "./mt-api.js";
import { dbGetMediaFiles, dbSaveMediaFile } from "../data/database.js";
import { Listeners } from "../../drjs/browser/event.js";

const log = Logger.create("Media", LOG_LEVEL.DEBUG);

class Media {
  constructor() {
    this.files = new ObservableArray();
    this.tags = new ObservableArray();
    this.albums = new ObservableArray();
    this.properties = new ObservableArray();
    this.propertyValues = new ObservableArray();
    this.searchFilterItems = new FilteredObservableView(this.files, null);
    this.dateFilterItems = new FilteredObservableView(
      this.searchFilterItems,
      null
    );
    this.sortedItems = new SortedObservableView(
      this.dateFilterItems,
      compareDates
    );
    this.visibleItems = new ObservableView(this.sortedItems);
    this.selectedItems = new ObservableView([]);
    this.lastSelect = null;

    this.listeners = new Listeners(
      this.files.updatedEvent.createListener(this, this.updateDatabaseItems)
    );
  }

  async loadItems() {
    runSerial(
      this.loadItemsFromDatabase.bind(this),
      this.loadItemsFromAPI.bind(this)
    );
  }

  async updateDatabaseItems() {
    for (var item of this.files) {
      if (item.isUpdated()) {
        await dbSaveMediaFile(item);
        item.unsetUpdated();
      }
    }
  }

  async loadItemsFromDatabase() {
    try {
      runSerial(dataLoader(dbGetMediaFiles, dataAdder(this.files, MediaFile)));
    } catch (ex) {
      log.error(ex, "failed to get items");
    }
  }

  async loadItemsFromAPI() {
    try {
      runParallel(
        dataLoader(getMediaFiles, dataUpdater(this.files, MediaFile)),
        dataLoader(getTags, dataUpdater(this.tags, Tag)),
        dataLoader(getProperties, dataUpdater(this.properties, Property)),
        dataLoader(
          getPropertyValues,
          dataUpdater(this.propertyValues, PropertyValue)
        ),
        dataLoader(getAlbums, dataUpdater(this.albums, Album))
      );
    } catch (ex) {
      log.error(ex, "failed to get items");
    }
  }

  getVisibleItems() {
    log.never("return visibleItems ");
    return this.visibleItems;
  }

  getAllFiles() {
    log.never("return all items ");
    return this.files;
  }

  getSelectedItems() {
    return this.selectedItems;
  }
  setSearchText(text) {
    var lcText = text.toLowerCase();
    this.searchFilterItems.setKeepFunction((item) => {
      return item.getName().toLowerCase().includes(lcText);
    });
  }

  setDateFilter(start, end) {
    var starttime = start ? start.getTime() : null;
    var endtime = end ? end.getTime() : null;
    this.dateFilterItems.setKeepFunction((item) => {
      return (
        (starttime == null || item.getDateTaken().getTime() >= starttime) &&
        (endtime == null || item.getDateTaken().getTime() <= endtime)
      );
    });
  }
  setSortType(type) {
    type = type.toLowerCase();
    if (type == "id") {
      this.sortedItems.setSortComparison(compareIds);
    } else if (type == "date") {
      this.sortedItems.setSortComparison(compareDates);
    } else {
      this.sortedItems.setSortComparison(compareNames);
    }
  }

  selectItem(item) {
    var index = this.visibleItems.indexOf(item);
    log.debug("inserting index ", index);
    this.selectedItems.clear();
    if (item == null) {
      log.error("selecting null item");
      return;
    }
    this.selectedItems.insertOnce(item);
    this.lastSelect = item;
  }

  addSelectItem(item) {
    if (item == null) {
      log.error("selecting null item");
      return;
    }
    this.selectedItems.insertOnce(item);
    this.lastSelect = item;
  }
  toggleSelectItem(item) {
    if (item == null) {
      log.error("selecting null item");
      return;
    }
    if (this.selectedItems.indexOf(item) != null) {
      this.selectedItems.remove(item);
    } else {
      this.selectedItems.insertOnce(item);
    }
    this.lastSelect = item;
  }

  selectToItem(item) {
    if (this.lastSelect == null) {
      this.selectItem(item);
    }
    var visible = this.getVisibleItems();
    var idx1 = visible.indexOf(item);
    var idx2 = visible.indexOf(this.lastSelect);
    if (idx1 == null || idx1 == null) {
      return this.selectItem(item);
    }
    log.debug(`select items ${idx1}-${idx2}`);
    var start = Math.min(idx1, idx2);
    var end = Math.max(idx1, idx2);

    for (var i = start; i <= end; i++) {
      // todo: an event is emitted each insert.  add a bulk insert so only 1 event results
      this.selectedItems.insertOnce(visible.getItemAt(i));
    }
    this.lastSelect = item;
  }
}

const media = new Media();

export default media;
