import { MediaEntity } from './media-entity.js';
import { LOG_LEVEL, Logger } from '../../drjs/logger.js';
import { toDate } from './helpers.js';
import { Util } from '../../drjs/util.js';
const log = Logger.create('MediaFile', LOG_LEVEL.DEBUG);

const CACHE_VERSION = 4;

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
    this.width = isNaN(data.width) ? 0 : Math.floor(data.width / 10) * 10;
    this.height = isNaN(data.height) ? 0 : Math.floor(data.height / 10) * 10;
    this.name = data.name;
    this.rotationDegrees = data.rotationDegrees || 0;
    this._group = null;

    this._tags = [];
    this._albums = [];
  }

  setValue(name, newValue) {
    // don't set rotationDegrees to null in an update
    if (name != 'rotationDegrees' || newValue != null) {
      this[name] = newValue;
    }
  }

  get RotationDegrees() {
    return this.rotationDegrees;
  }
  rotate(degrees) {
    const d = Util.toNumber(this.rotationDegrees, 0);
    const change = Util.toNumber(degrees, 0);
    this.rotationDegrees = (d + change + 360) % 360;
    this.setChanged();
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
    const pos = this._tags.indexOf(tags);
    if (pos >= 0) {
      this._tags.splice(pos, 1);
    }
  }

  get Tags() {
    return this._tags;
  }
  hasTag(tag) {
    if (tag == null) {
      return true;
    }
    let id = tag;
    if (typeof tag == 'object') {
      id = tag.getId();
    }
    return this._tags.find((t) => {
      return t.getId() == id;
    });
  }

  setAlbums(albums) {
    this._albums = albums;
  }

  getAlbums() {
    return this._albums;
  }
  addAlbum(album) {
    if (!this._albums.includes(album)) {
      this._albums.push(album);
    }
  }

  removeAlbum(albums) {
    const pos = this._albums.indexOf(albums);
    if (pos >= 0) {
      this._albums.splice(pos, 1);
    }
  }

  hasAlbum(album) {
    if (album == null) {
      return true;
    }
    let id = album;
    if (typeof album == 'object') {
      id = album.getId();
    }
    return this._albums.find((t) => {
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
    if (group.getPrimaryFile().getId() != this.fileSetPrimaryId) {
      this.setChanged();
    }

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
  /*
   * update(data) {
   *   super.update(data);
   *   this.dateTaken = data.dateTaken;
   *   this.fileSize = data.fileSize;
   * }
   */
  getThumbnailUrl() {
    return `/thumbnail/${this.getId()}`;
  }
  getImageUrl() {
    return `/image/${this.getId()}`;
  }
  getImageReloadUrl() {
    return `/image/${this.getId()}`;
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

  get Extension() {
    return this.getExtension();
  }

  getExtension() {
    if (this._extension == null) {
      const dotPos = this.filename.lastIndexOf('.');
      if (dotPos < 0) {
        this._extension = '.';
      } else {
        this._extension = this.filename.substring(dotPos).toLowerCase();
      }
    }
    return this._extension;
  }

  isBrowserImg() {
    return ['.jpg', '.gif', '.png', '.jpeg', '.webp'].includes(this.Extension);
  }

  getResolution() {
    if (
      isNaN(this.width) ||
      isNaN(this.height) ||
      this.width == 0 ||
      this.height == 0
    ) {
      return 'unknown';
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
      log.warn('MediaFile.fromData called with null data');
      return null;
    }
    if (!(file instanceof MediaFile)) {
      log.warn('MediaFile.fromData requires a MediaFile parameter');
      return null;
    }
    return file.toJson();
  }

  toJson() {
    return Object.entries(this).reduce((props, val) => {
      if (val[0][0] != '_') {
        props[val[0]] = val[1];
      }
      return props;
    }, {});
  }

  static fromJson(data) {
    if (data == null) {
      log.warn('MediaFile.fromData called with null data');
      return null;
    }
    return new MediaFile(data);
  }
}

export default MediaFile;
