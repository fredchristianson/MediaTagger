import { MediaEntity } from "./media-entity.js";
import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
const log = Logger.create("Album", LOG_LEVEL.DEBUG);

export class Album extends MediaEntity {
  constructor(data = {}) {
    super(data);
    this.description = data.description;
    this._files = [];
  }

  addFile(file) {
    if (!this._files.includes(file)) {
      this._files.push(file);
    }
  }

  removeFile(file) {
    var pos = this._files.indexOf(file);
    if (pos >= 0) {
      this._files.splice(pos, 1);
    }
  }
  update(data) {
    super.update(data);
  }
}

export class MediaAlbum {
  constructor({ id, albums }) {
    this.mediaFileId = id;
    this.albumIds = albums;
  }

  getId() {
    return this.mediaFileId;
  }
  getMediaFileId() {
    return this.mediaFileId;
  }
  getAlbumIds() {
    return this.albumIds;
  }
}

export default Album;
