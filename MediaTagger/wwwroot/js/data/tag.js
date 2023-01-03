import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import { MediaEntity } from "./media-entity.js";
const log = Logger.create("Tag", LOG_LEVEL.DEBUG);

export class Tag extends MediaEntity {
  constructor(data = {}) {
    super(data);
    this.parentId = data.parentId;
  }
  update(data) {
    super.update(data);
  }

  getParentId() {
    return this.parentId;
  }
}

export default Tag;
