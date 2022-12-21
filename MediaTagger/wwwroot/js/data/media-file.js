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
    this.name = data.name;
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
