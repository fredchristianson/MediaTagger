import { MediaEntity } from "./media-entity.js";
import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
const log = Logger.create("Property", LOG_LEVEL.DEBUG);

export class PropertyValue extends MediaEntity {
  constructor(data = {}) {
    super(data);
  }
  update(data) {
    super.update(data);
  }
}

export class Property extends MediaEntity {
  constructor(data = {}) {
    super(data);
  }
  update(data) {
    super.update(data);
  }
}

export default Property;
