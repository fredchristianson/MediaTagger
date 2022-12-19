import { MediaEntity } from "./media-entity.js";
import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
const log = Logger.create("MediaFile", LOG_LEVEL.DEBUG);

export class MediaFile extends MediaEntity {
  constructor(data = {}) {
    super(data);
    this.dateTaken = data.dateTaken;
    this.fileSize = data.fileSize;
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
    if (this.modifiedOn && !isNaN(this.modifiedOn)) {
      return this.modifiedOn;
    }
    if (this.createdOn && !isNaN(this.createdOn)) {
      return this.createdOn;
    }
    return new Date(2000, 0, 1);
  }
}

export default MediaFile;
