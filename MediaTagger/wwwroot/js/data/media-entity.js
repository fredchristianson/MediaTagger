import { toDate } from './helpers.js';

export class MediaEntity {
  static sort(array) {
    array.sort((a, b) => {
      return a.Name.localeCompare(b.Name);
    });
    return array;
  }
  constructor(data = {}) {
    this.id = data.id;
    this.name = data.name;
    this.createdOn = toDate(data.createdOn);
    this.modifiedOn = toDate(data.modifiedOn);
    this.hidden = !!data.hidden;
    this._changed = typeof data._changed == 'boolean' ? data._changed : false;
  }

  isChanged() {
    return this._changed;
  }

  setChanged() {
    this._changed = true;
  }
  unsetChanged() {
    this._changed = false;
  }

  equals(other) {
    if (this == null) {
      return other == null;
    }
    if (other == null) {
      return false;
    }
    return (
      this.getId() == other.getId() && this.constructor == other.constructor
    );
  }
  update(data) {
    // this.id = data.id;
    // this.name = data.name;
    // this.createdOn = data.createdOn;
    // this.modifiedOn = data.modifiedOn;
    // this.hidden = data.hidden;
    Object.entries(this).forEach(([key, value]) => {
      if (key[0] == '_') {
        return;
      }
      if (value instanceof Date) {
        let newDate = toDate(data[key]);
        if (value.getTime() != newDate.getTime()) {
          this.setChanged();
          this[key] = newDate;
        }
      } else if (typeof value == 'boolean') {
        let newBool = !!data[key];
        if (value != newBool) {
          this.setChanged();
          this[key] = newBool;
        }
      } else {
        let newValue = data[key];
        if (value != newValue) {
          this.setChanged();
          this.setValue(key, newValue);
        }
      }
    });
  }

  setValue(name, newValue) {
    this[name] = newValue;
  }

  get Id() {
    return this.id;
  }
  get Name() {
    return this.name;
  }
  set Name(name) {
    this.name = name;
  }
  getId() {
    return this.id;
  }
  getName() {
    return this.name;
  }
  getCreatedOn() {
    return this.createdOn;
  }
  getModifiedOn() {
    return this.modifiedOn;
  }
  isHidden() {
    return this.hidden;
  }
}

export default MediaEntity;
