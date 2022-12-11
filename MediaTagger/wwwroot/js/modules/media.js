import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import { Listeners } from "../../drjs/browser/event.js";
import UTIL from "../../drjs/util.js";

const log = Logger.create("Media", LOG_LEVEL.INFO);
import api from "../mt-api.js";
import { ObservableList } from "./collections.js";

class Media {
  constructor() {
    this.items = new ObservableList();
    this.files = new ObservableList();
    this.groups = new ObservableList();
    this.visibleItems = new ObservableList();
  }

  async getAll() {
    try {
      log.debug("Media.getAll ");
      this.items.setItems(await api.GetAllMediaItems());
      this.visibleItems.setItems(this.items);
      this.files.setItems(await api.GetAllMediaFiles());
      this.groups.setItems(await api.GetAllMediaGroups());
    } catch (ex) {
      log.error(ex, "failed to get items");
    }
  }

  getVisibleItems() {
    log.debug("return visibleItems ");
    return this.visibleItems;
  }
}

const media = new Media();

export default media;
