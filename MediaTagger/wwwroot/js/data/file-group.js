import { MediaEntity } from './media-entity.js';
import { LOG_LEVEL, Logger } from '../../drjs/logger.js';
import { toDate } from './helpers.js';
import { ObservableArray } from '../modules/collections.js';
const log = Logger.create('MediaFile', LOG_LEVEL.DEBUG);

export class FileGroup {
  constructor(primary = null) {
    this._primaryFile = null;
    this._files = new ObservableArray();
    this.setPrimaryFile(primary);
  }

  getPrimaryFile() {
    return this._primaryFile;
  }
  getFiles() {
    return this._files;
  }
  setPrimaryFile(file) {
    if (file == null) {
      return;
    }
    this._primaryFile = file;
    this._files.insertOnce(file);
    file.setGroup(this);
  }

  addFile(file) {
    if (file == null) {
      return;
    }
    this._files.insertOnce(file);
    file.setGroup(this);
  }
  removeFile(file) {
    if (file == this._primaryFile) {
      for (let member of this._files) {
        member.setGroup(null);
      }
      this._files.clear();
      this._primaryFile = null;
    } else {
      file.setGroup(null);
      this._files.remove(file);
    }
  }
}

export default FileGroup;
