import { MediaEntity } from "./media-entity.js";
import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import { toDate } from "./helpers.js";
const log = Logger.create("MediaFile", LOG_LEVEL.DEBUG);

export class MediaFile extends MediaEntity {
  constructor(data = {}) {
    super(data);
    this.dateTaken = data.dateTaken;
    this.fileSize = data.fileSize;
    this.directory = data.directory;
    this.fileModifiedOn = toDate(data.fileModifiedOn);
    this.fileCreatedOn = toDate(data.fileCreatedOn);
    this.fileSetPrimaryId = data.fileSetPrimaryId;
    this.filename = data.filename;
    this.width = data.width;
    this.height = data.height;
    this.name = data.name;
    this._group = null;
    this._tags = [];
  }

  setTags(tags) {
    this._tags = tags;
  }
  getTags() {
    return this._tags;
  }
  addTag(tag) {
    if (!this._tags.includes(tag)) {
      this._tags.push(tag);
    }
  }

  removeTag(tags) {
    var pos = this._tags.indexOf(tags);
    if (pos >= 0) {
      this._tags.splice(pos, 1);
    }
  }

  hasTag(tag) {
    if (tag == null) {
      return true;
    }
    var id = tag;
    if (typeof tag == "object") {
      id = tag.getId();
    }
    return this._tags.find((t) => {
      return t.getId() == id;
    });
  }

  getGroup() {
    return this._group;
  }
  setGroup(group) {
    if (this._group == group) {
      return;
    }
    if (group == null) {
      this._group = null;
      this.fileSetPrimaryId = null;
      this.setChanged();
      return;
    }
    this._changed = group.getPrimaryFile().getId() != this.fileSetPrimaryId;
    this._group = group;
    if (group == null) {
      this.fileSetPrimaryId = null;
    } else if (group.getPrimaryFile == this) {
      this.fileSetPrimaryId = this.getId();
    } else {
      this.fileSetPrimaryId = group.getPrimaryFile().getId();
    }
  }
  isInGroup() {
    return this.fileSetPrimaryId != null;
  }
  isPrimary() {
    return this.id == this.fileSetPrimaryId || this.fileSetPrimaryId == null;
  }
  isGroupSecondary() {
    return this.fileSetPrimaryId != null && this.fileSetPrimaryId != this.id;
  }
  // update(data) {
  //   super.update(data);
  //   this.dateTaken = data.dateTaken;
  //   this.fileSize = data.fileSize;
  // }
  getThumbnailUrl() {
    return `/thumbnail/${this.getId()}?v=1.0`;
  }
  getImageUrl() {
    return `/image/${this.getId()}?v=1.0`;
  }

  getName() {
    return this.name;
  }
  getFilename() {
    return this.filename;
  }

  getFileSize() {
    return this.fileSize;
  }

  getExtension() {
    if (this._extension == null) {
      var dotPos = this.filename.lastIndexOf(".");
      if (dotPos < 0) {
        this._extension = ".";
      } else {
        this._extension = this.filename.substring(dotPos).toLowerCase();
      }
    }
    return this._extension;
  }

  getResolution() {
    if (
      isNaN(this.width) ||
      isNaN(this.height) ||
      this.width == 0 ||
      this.height == 0
    ) {
      return "unknown";
    }
    return `${this.width}x${this.height}`;
  }

  getWidth() {
    return this.width;
  }
  getHeight() {
    return this.height;
  }

  getTakenMSecs() {
    return this.dateTaken == null ? null : this.dateTaken.getTime();
  }
  getDateTaken() {
    if (this.dateTaken && !isNaN(this.dateTaken)) {
      return this.dateTaken;
    }
    if (this.fileModifiedOn && !isNaN(this.fileModifiedOn)) {
      return this.fileModifiedOn;
    }
    if (this.fileCreatedOn && !isNaN(this.fileCreatedOn)) {
      return this.fileCreatedOn;
    }
    return new Date(2000, 0, 1);
  }

  static toJson(file) {
    if (file == null) {
      log.warn("MediaFile.fromData called with null data");
      return null;
    }
    if (!(file instanceof MediaFile)) {
      log.warn("MediaFile.fromData requires a MediaFile parameter");
      return null;
    }
    return file.toJson();
  }

  toJson() {
    return Object.entries(this).reduce((props, val) => {
      if (val[0][0] != "_") {
        props[val[0]] = val[1];
      }
      return props;
    }, {});
  }

  static fromJson(data) {
    if (data == null) {
      log.warn("MediaFile.fromData called with null data");
      return null;
    }
    return new MediaFile(data);
  }
}

export default MediaFile;
