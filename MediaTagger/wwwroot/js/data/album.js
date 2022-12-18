import { MediaEntity } from "./media-entity.js";
import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
const log = Logger.create("Album", LOG_LEVEL.DEBUG);

export class Album extends MediaEntity {
  constructor(data = {}) {
    super(data);
  }

  update(data) {
    super.update(data);
  }
}

export default Album;
