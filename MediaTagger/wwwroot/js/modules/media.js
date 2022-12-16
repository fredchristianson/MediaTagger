import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
const log = Logger.create("Media", LOG_LEVEL.INFO);
import api from "../mt-api.js";
import Database from "../../drjs/browser/database.js";

import {
  ObservableView,
  SortedObservableView,
  FilteredObservableView,
} from "./collections.js";

function compareIds(a, b) {
  if (a == null) {
    return b == null ? 0 : -1;
  }
  if (b == null) {
    return 1;
  }
  return a.getId().localeCompare(b.getId());
}

function compareNames(a, b) {
  if (a == null) {
    return b == null ? 0 : -1;
  }
  if (b == null) {
    return 1;
  }
  return a.getName().localeCompare(b.getName());
}

function compareDates(a, b) {
  if (a == null) {
    return b == null ? 0 : -1;
  }
  if (b == null) {
    return 1;
  }
  return a.getDateTaken() - b.getDateTaken();
}

function toDate(val) {
  if (val == null || val instanceof Date) {
    return val;
  } else {
    try {
      if (typeof val == "string") {
        return new Date(Date.parse(val));
      }
      return new Date(val);
    } catch (ex) {
      return null;
    }
  }
}

class MediaObject {
  constructor(data) {
    this.name = data.name;
    this.dateTaken = toDate(data.dateTaken);
    this.dateCreated = toDate(data.dateCreated);
    this.dateModified = toDate(data.dateModified);
  }

  getDateTaken() {
    if (this.dateTaken && !isNaN(this.dateTaken)) {
      return this.dateTaken;
    }
    if (this.dateModified && !isNaN(this.dateModified)) {
      return this.dateModified;
    }
    if (this.dateCreated && !isNaN(this.dateCreated)) {
      return this.dateCreated;
    }
    return new Date(2000, 0, 1);
  }

  getName() {
    return this.name;
  }
}

export class MediaFile extends MediaObject {
  constructor(data) {
    super(data);
    this.fileId = data.mediaFileId;
    this.mediaItemId = data.mediaItemId;
    this.mediaItem = null;
    this.id = "f" + this.fileId;
    this.fileSize = data.fileSize;
  }

  getMediaId() {
    return `m${this.mediaItemId}`;
  }
  getMediaItem() {
    return this.mediaItem;
  }
  setMediaItem(item) {
    this.mediaItem = item;
  }
  getId() {
    return this.id;
  }

  getThumbnailUrl() {
    return `/thumbnail/${this.fileId}?v=1.0`;
  }
  getImageUrl() {
    return `/image/${this.fileId}?v=1.0`;
  }
}

export class MediaItem extends MediaObject {
  constructor(data) {
    super(data);
    this.mediaItemId = data.mediaItemId;
    this.files = [];
    this.primaryFile = null;
    this.primaryFileId = data.primaryFileId;
    this.id = "m" + this.mediaItemId;
  }

  getId() {
    return this.id;
  }

  getDateTaken() {
    if (this.primaryFile) {
      return this.primaryFile.getDateTaken();
    }
    if (this.files != null && this.files.length > 0) {
      return this.files[0].getDateTaken();
    }
    return super.getDateTaken();
  }

  setPrimaryFile(file) {
    this.primaryFile = file;
    this.addFile(file);
  }
  getPrimaryFile() {
    return this.primaryFile;
  }

  getPrimaryFileId() {
    return this.primaryFileId;
  }
  addFile(file) {
    if (
      this.files.find((f) => {
        return f.getId() == file.getId();
      }) == null
    ) {
      this.files.push(file);
    }
  }

  getThumbnailUrl() {
    if (this.primaryFileId == null) {
      return "/image/unknownType.png";
    }
    return `/thumbnail/${this.primaryFileId}?v=1.0`;
  }
  getImageUrl() {
    if (this.primaryFileId == null) {
      return "/image/unknownType.png";
    }
    return `/image/${this.primaryFileId}?v=1.0`;
  }
}

export class MediaGroup extends MediaObject {
  constructor(data) {
    super(data);
    this.groupId = data.groupId;
    this.id = "g" + this.groupId;
  }

  getId() {
    return this.id;
  }
}

class Media {
  constructor() {
    this.mediaItems = null;
    this.files = null;
    this.groups = null;
    this.visibleItems = null;
    this.database = new Database("media", 3, ["items"]);
    this.visibleItems = new ObservableView([]);
  }

  async loadItems() {
    this.databaseTable = await this.database.getTable("items");

    if (!(await this.loadItemsFromDatabase())) {
      await this.loadItemsFromAPI();
      this.saveItemsToDatabase();
    } else {
      // using the browser DB items until server items are loaded
      this.refreshItemsFromAPI().then(() => {
        log.info("items refreshed");
      });
    }
  }

  async loadItemsFromDatabase() {
    var mediaItemData = await this.databaseTable.get("mediaItems");
    var fileData = await this.databaseTable.get("files");
    var groupData = await this.databaseTable.get("groups");
    if (mediaItemData != null && fileData != null && groupData != null) {
      return this.setupDataViews(mediaItemData, fileData, groupData);
    }
    return false;
  }

  async loadItemsFromAPI() {
    try {
      log.debug("Media.getAll ");
      var mediaItemData = await api.GetAllMediaItems();
      var fileData = await api.GetAllMediaFiles();
      var groupData = await api.GetAllMediaGroups();
      await this.databaseTable.set("mediaItems", mediaItemData);
      await this.databaseTable.set("files", fileData);
      await this.databaseTable.set("groups", groupData);

      this.setupDataViews(mediaItemData, fileData, groupData);
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
    log.debug("return visibleItems ");
    return this.visibleItems;
  }

  getAllItems() {
    log.debug("return all items ");
    return this.mediaItems;
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
}

const media = new Media();

export default media;
