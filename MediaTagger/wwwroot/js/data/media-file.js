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
    this.fileModified = toDate(data.fileModifiedOn);
    this.fileCreated = toDate(data.fileCreatedOn);
  }

  update(data) {
    super.update(data);
    this.dateTaken = data.dateTaken;
    this.fileSize = data.fileSize;
  }
  getThumbnailUrl() {
    return `/thumbnail/${this.getId()}?v=1.0`;
  }
  getImageUrl() {
    return `/image/${this.getId()}?v=1.0`;
  }

  getDateTaken() {
    if (this.dateTaken && !isNaN(this.dateTaken)) {
      return this.dateTaken;
    }
    if (this.fileModified && !isNaN(this.fileModified)) {
      return this.fileModified;
    }
    if (this.fileCreated && !isNaN(this.fileCreated)) {
      return this.fileCreated;
    }
    return new Date(2000, 0, 1);
  }
}

export default MediaFile;
