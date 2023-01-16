import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import { MediaEntity } from "./media-entity.js";
const log = Logger.create("Tag", LOG_LEVEL.DEBUG);

export class Tag extends MediaEntity {
  constructor(data = {}) {
    super(data);
    this.parentId = data.parentId;
    this.hidden = data.hidden;
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

  hasFile(file) {
    return this._files.includes(file);
  }

  get Files() {
    return this._files;
  }

  update(data) {
    super.update(data);
  }

  getParentId() {
    return this.parentId;
  }

  get ParentId() {
    return this.parentId;
  }

  set ParentId(id) {
    this.parentId = id;
  }
  getHidden() {
    return this.hidden;
  }
  get Hidden() {
    return this.hidden;
  }
  set Hidden(hide) {
    this.hidden = hide;
  }
}

export class MediaTag {
  constructor({ id, tags }) {
    this.mediaFileId = id;
    this.tagIds = tags;
  }

  getId() {
    return this.mediaFileId;
  }
  getMediaFileId() {
    return this.mediaFileId;
  }
  getTagIds() {
    return this.tagIds;
  }
}

export default Tag;
