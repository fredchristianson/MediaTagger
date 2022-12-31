import { toDate } from "./helpers.js";

export class MediaEntity {
  constructor(data = {}) {
    this.id = data.id;
    this.name = data.name;
    this.createdOn = toDate(data.createdOn);
    this.modifiedOn = toDate(data.modifiedOn);
    this.hidden = !!data.hidden;
    this._changed = typeof data._changed == "boolean" ? data._changed : false;
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
      if (key[0] == "_") {
        return;
      }
      if (value instanceof Date) {
        var newDate = toDate(data[key]);
        if (value.getTime() != newDate.getTime()) {
          this.setChanged();
          this[key] = newDate;
        }
      } else if (typeof value == "boolean") {
        var newBool = !!data[key];
        if (value != newBool) {
          this.setChanged();
          this[key] = newBool;
        }
      } else {
        var newValue = data[key];
        if (value != newValue) {
          this.setChanged();
          this[key] = newValue;
        }
      }
    });
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
