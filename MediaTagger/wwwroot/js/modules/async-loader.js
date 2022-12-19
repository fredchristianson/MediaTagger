import { ComponentLoader } from "../../drjs/browser/component-loader.js";
import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import dom from "../../drjs/browser/dom.js";
import Media from "./media.js";
import items from "../data/items.js";

const log = Logger.create("AsyncLoader", LOG_LEVEL.WARN);

const DEFAULT_PRIORITY = 5;

class LoadStatus {
  constructor(item) {
    this.item = item;
    this.loaded = false;
    this.loading = false;
    this.error = false;
    this.thumbnail = null;
  }
}

class AsyncLoader {
  constructor() {
    this.concurrentLoadLimit = 1;
    this.activeLoadCount = 0;
    this.loadCompleteHandler = this.loadComplete.bind(this);
    this.loadErrorHandler = this.loadError.bind(this);
    this.container = dom.createElement("div");
    dom.append("body", this.container);

    this.loadedItems = {};
    this.unloadedItems = {};
    Media.getAllFiles()
      .getUpdatedEvent()
      .createListener(this, this.updateItems);
  }

  updateItems(items) {
    for (var item of items) {
      if (
        this.loadedItems[item.getId()] == null &&
        this.unloadedItems[item.getId()] == null
      ) {
        var status = new LoadStatus(item);
        this.unloadedItems[item.getId()] = status;
      }
    }
    this.check();
  }

  setConcurrentLoadLimit(limit) {
    this.concurrentLoadLimit = limit;
  }

  findUnloadedElement() {
    var element = dom.first(".media-item.unloaded");
    while (element != null) {
      var img = dom.first(element, "img");
      var id = dom.getData(element, "file-id");
      var status = this.loadedItems[id];
      if (status != null) {
        this.updateDOMImage(img, false);
      } else {
        status = this.unloadedItems[id];
        if (status != null) {
          return status;
        } else {
          log.error("found unloaded .media-item without a loadStatus");
          dom.removeClass(element, "unloaded");
        }
      }
      element = dom.first(".media-item.unloaded");
    }
    return null;
  }

  getNextItemStatus() {
    var itemStatus = this.findUnloadedElement();
    if (itemStatus != null) {
      return itemStatus;
    }
    var priority = 0;
    var first = Object.entries(this.unloadedItems)[0];
    if (first != null) {
      delete this.unloadedItems[first[0]];
      return first[1];
    }

    return itemStatus;
  }

  check() {
    if (this.activeLoadCount >= this.concurrentLoadLimit) {
      return;
    }
    var itemStatus = this.getNextItemStatus();
    while (
      itemStatus != null &&
      this.activeLoadCount < this.concurrentLoadLimit
    ) {
      log.debug(
        `load (${this.activeLoadCount}) ${itemStatus.item.getThumbnailUrl()}`
      );
      this.activeLoadCount += 1;
      itemStatus.loading = true;
      itemStatus.thumbnail = new Image();
      // uncomment this to display the loading thumbnails in the page
      //dom.append(this.container, itemStatus.thumbnail);
      dom.setData(
        itemStatus.thumbnail,
        "orig-src",
        itemStatus.item.getThumbnailUrl()
      );
      dom.setData(itemStatus.thumbnail, "file-id", itemStatus.item.getId());
      itemStatus.thumbnail.addEventListener("load", this.loadCompleteHandler);
      itemStatus.thumbnail.addEventListener("error", this.loadErrorHandler);
      itemStatus.thumbnail.src = itemStatus.item.getThumbnailUrl();
      log.debug(
        `load listening (${
          this.activeLoadCount
        }) ${itemStatus.item.getThumbnailUrl()}`
      );
      this.loadedItems[itemStatus.item.id] = itemStatus;
      delete this.unloadedItems[itemStatus.item.id];
      if (itemStatus.thumbnail.complete) {
        this.finishLoading(itemStatus.thumbnail, false);
        this.activeLoadCount -= 1;
        log.debug(
          `load already complete (${
            this.activeLoadCount
          }) ${itemStatus.item.getThumbnailUrl()}`
        );
        this.scheduleCheck();
      }

      itemStatus = this.getNextItemStatus();
    }
  }

  loadComplete(event) {
    var img = event.target;
    log.debug(
      `load complete (${this.activeLoadCount}) ${img ? img.src : "no src"}`
    );

    this.activeLoadCount -= 1;
    this.finishLoading(img, false);
    log.debug(
      `load finished (${this.activeLoadCount}) ${img ? img.src : "no src"}`
    );
    this.scheduleCheck();
  }

  finishLoading(img, error) {
    var id = dom.getData(img, "file-id");
    var stat = this.loadedItems[id];
    if (stat != null) {
      stat.loading = false;
      stat.loaded = true;
      stat.error = false;
    }

    var src = dom.getData(img, "orig-src");
    var elements = dom.find(`[file-id="${id}"]`);
    elements.forEach((e) => {
      this.updateDOMImage(e, error);
    });
  }

  loadError(event) {
    var img = event.target;
    log.debug(
      `load error (${this.activeLoadCount}) ${img ? img.src : "no src"}`
    );
    for (var f of this.itemStatus) {
      if (f.thumbnail == img) {
        f.loading = false;
        f.loaded = false;
        f.error = true;
      }
    }
    log.error("failed to load thumbnail ", event.target.src);
    this.activeLoadCount -= 1;
    this.finishLoading(img, false);
    log.debug(
      `load error finished (${this.activeLoadCount}) ${
        img ? img.src : "no src"
      }`
    );

    this.scheduleCheck();
  }

  updateDOMImage(img, error = false) {
    if (error) {
      dom.addClass(dom.getParent(img), "error");
    }
    var id = dom.getData(img, "file-id");
    if (id == null) {
      return;
    }
    var itemStatus = this.loadedItems[id];
    if (itemStatus != null) {
      img.src = itemStatus.thumbnail.src;
      dom.addClass(dom.getParent(img), "loaded");
      dom.removeClass(dom.getParent(img), "unloaded");
    }
  }

  scheduleCheck() {
    setTimeout(() => {
      this.check();
    }, 1000);
  }
}

var asyncLoader = new AsyncLoader();

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node instanceof HTMLElement) {
        var images = dom.find(node, "img");
        //var images = dom.find("img");
        images.forEach((image) => {
          asyncLoader.updateDOMImage(image, false);
        });
        log.never(`found ${images.length} images`);
      }
    });
  });
  asyncLoader.scheduleCheck();
});
observer.observe(document.body, { subtree: true, childList: true });

export default asyncLoader;
