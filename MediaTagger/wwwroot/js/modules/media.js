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
import { dataLoader, dataUpdater } from "../data/data-loader.js";
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

const log = Logger.create("Media", LOG_LEVEL.DEBUG);

class Media {
  constructor() {
    this.files = new ObservableArray();
    this.tags = new ObservableArray();
    this.albums = new ObservableArray();
    this.properties = new ObservableArray();
    this.propertyValues = new ObservableArray();
    this.nameFilterItems = new FilteredObservableView(this.files, null);
    this.dateFilterItems = new FilteredObservableView(
      this.nameFilterItems,
      null
    );
    this.sortedItems = new SortedObservableView(
      this.dateFilterItems,
      compareDates
    );
    this.visibleItems = new ObservableView(this.sortedItems);
    this.selectedItems = new ObservableView([]);
    this.lastSelect = null;
  }

  async loadItems() {
    runSerial(
      this.loadItemsFromDatabase.bind(this),
      this.loadItemsFromAPI.bind(this)
    );
  }

  async loadItemsFromDatabase() {}

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

  async setupDataViews(items, files, groups) {
    try {
      log.debug("Media.getAll ");
      this.mediaItems = new ObservableView(
        items.map((i) => {
          return new MediaItem(i);
        })
      );

      var itemsById = {};
      var filesById = {};
      for (var item of this.mediaItems) {
        itemsById[item.getId()] = item;
      }
      this.files = new ObservableView(
        files.map((f) => {
          return new MediaFile(f);
        })
      );
      for (var file of this.files) {
        filesById[file.fileId] = file;
        var mediaItem = itemsById[file.getMediaId()];
        if (mediaItem != null) {
          file.setMediaItem(mediaItem);
          mediaItem.addFile(file);
          if ("f" + mediaItem.getPrimaryFileId() == file.getId()) {
            mediaItem.setPrimaryFile(file);
          }
        }
      }
      this.groups = new ObservableView(
        groups.map((g) => {
          return new MediaGroup(g);
        })
      );

      this.dateFilterItems = new FilteredObservableView(this.mediaItems);
      this.searchFilterItems = new FilteredObservableView(this.dateFilterItems);
      this.sortedItems = new SortedObservableView(this.searchFilterItems);
      this.setSortType("name");
      this.visibleItems.setCollection(this.sortedItems);
      return true;
    } catch (ex) {
      log.error(ex, "failed to get items");
      return false;
    }
  }

  async refreshItemsFromAPI() {
    try {
      log.debug("Media.getAll ");
      var mediaItemData = await api.GetAllMediaItems();
      var fileData = await api.GetAllMediaFiles();
      var groupData = await api.GetAllMediaGroups();
      await this.databaseTable.set("mediaItems", mediaItemData);
      await this.databaseTable.set("files", fileData);
      await this.databaseTable.set("groups", groupData);
      this.refreshDataViews(mediaItemData, fileData, groupData);
    } catch (ex) {
      log.error(ex, "failed to get items");
    }
  }

  async refreshDataViews(items, files, groups) {
    try {
      // todo: update instead of replace collection data
      log.debug("Media.getAll ");
      this.mediaItems = new ObservableView(
        items.map((i) => {
          return new MediaItem(i);
        })
      );

      var itemsById = {};
      var filesById = {};
      for (var item of this.mediaItems) {
        itemsById[item.getId()] = item;
      }
      this.files = new ObservableView(
        files.map((f) => {
          return new MediaFile(f);
        })
      );
      for (var file of this.files) {
        filesById[file.fileId] = file;
        var mediaItem = itemsById[file.getMediaId()];
        if (mediaItem != null) {
          file.setMediaItem(mediaItem);
          mediaItem.addFile(file);
          if ("f" + mediaItem.getPrimaryFileId() == file.getId()) {
            mediaItem.setPrimaryFile(file);
          }
        }
      }
      this.groups = new ObservableView(
        groups.map((g) => {
          return new MediaGroup(g);
        })
      );

      this.dateFilterItems = new FilteredObservableView(this.mediaItems);
      this.searchFilterItems = new FilteredObservableView(this.dateFilterItems);
      this.sortedItems = new SortedObservableView(this.searchFilterItems);
      this.setSortType("name");
      this.visibleItems.setCollection(this.sortedItems);
      return true;
    } catch (ex) {
      log.error(ex, "failed to get items");
      return false;
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
