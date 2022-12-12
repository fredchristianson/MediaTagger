import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import { Listeners } from "../../drjs/browser/event.js";
import UTIL from "../../drjs/util.js";
import asyncLoader from "./async-loader.js";
const log = Logger.create("Media", LOG_LEVEL.INFO);
import api from "../mt-api.js";
import { ObservableList } from "./collections.js";

class MediaObject {
  constructor(data) {
    this.name = data.name;
  }

  getName() {
    return this.name;
  }
}

export class MediaFile extends MediaObject {
  constructor(data) {
    super(data);
    this.fileId = data.mediaFileId;
    this.mediaItem = null;
    this.id = "f" + this.fileId;
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
    this.items = new ObservableList();
    this.files = new ObservableList();
    this.groups = new ObservableList();
    this.filesById = [];
    this.itemsById = [];
    this.visibleItems = new ObservableList();
  }

  async getAll() {
    try {
      log.debug("Media.getAll ");
      this.items.setItems(
        (await api.GetAllMediaItems()).map((item) => {
          return new MediaItem(item);
        })
      );
      asyncLoader.addFiles(this.items.getItems());

      this.items.getItems().forEach((item) => {
        this.itemsById[item.getId()] = item;
      });
      this.visibleItems.setItems(this.items);
      this.files.setItems(
        (await api.GetAllMediaFiles()).map((file) => {
          return new MediaFile(file);
        })
      );
      this.files.getItems().forEach((file) => {
        this.filesById[file.fileId] = file;
        var item = this.itemsById[file.getId()];
        if (item != null) {
          file.setMediaItem(item);
          item.addFile(file);
          if (item.getPrimaryFileId() == file.getId()) {
            item.setPrimaryFile(file);
          }
        }
      });
      this.groups.setItems(
        (await api.GetAllMediaGroups()).map((g) => {
          return new MediaGroup(g);
        })
      );
    } catch (ex) {
      log.error(ex, "failed to get items");
    }
  }

  getVisibleItems() {
    log.debug("return visibleItems ");
    return this.visibleItems;
  }
}

const media = new Media();

export default media;
