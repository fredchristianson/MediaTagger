import { toDate } from "./helpers.js";

export class MediaEntity {
  constructor(data = {}) {
    this.id = data.id;
    this.name = data.name;
    this.createdOn = toDate(data.createdOn);
    this.modifiedOn = toDate(data.modifiedOn);
    this.hidden = !!data.hidden;
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
    this.id = data.id;
    this.name = data.name;
    this.createdOn = data.createdOn;
    this.modifiedOn = data.modifiedOn;
    this.hidden = data.hidden;
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
