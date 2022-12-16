import { ComponentLoader } from "../../drjs/browser/component-loader.js";
import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import dom from "../../drjs/browser/dom.js";
import Media from "./media.js";

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

    // put loading images in the dom so I can see them with debugger if needed
    this.container.style.position = "absolute";
    this.container.style.right = 0;
    this.container.style.top = 0;
    this.container.style.width = "100px";
    this.container.style.height = "64px";
    this.container.style.zIndex = -1;
    this.container.style.overflow = "auto";
    this.nextItemIndex = 0;
    this.itemStatus = [];
    Media.getVisibleItems()
      .getUpdatedEvent()
      .createListener(this, this.updateItems);
  }

  updateItems(items) {
    for (var item of items) {
      var status = new LoadStatus(item);
      this.itemStatus.push(status);
    }
    log.debug(`${this.itemStatus.length} items to be scanned`);
    this.nextItemIndex = 0;
    this.check();
  }

  setNextItemIndex(index) {
    this.nextItemIndex = index % this.itemStatus.length;
    log.debug(`scanning from index ${this.nextItemIndex}`);
  }

  setNextItem(item) {
    for (
      this.nextItemIndex = 0;
      this.nextItemIndex < this.itemStatus.length;
      this.nextItemIndex++
    ) {
      if (this.itemStatus[this.nextItemIndex].item == item) {
        break;
      }
    }
    log.debug(`scanning from index ${this.nextItemIndex}`);
  }

  setConcurrentLoadLimit(limit) {
    this.concurrentLoadLimit = limit;
  }

  getNextItemStatus() {
    var itemStatus = null;
    var priority = 0;
    for (
      var index = 0;
      itemStatus == null && index < this.itemStatus.length;
      index++
    ) {
      var pos = (index + this.nextItemIndex) % this.itemStatus.length;
      var stat = this.itemStatus[pos];
      if (stat.thumbnail == null && !stat.error) {
        itemStatus = stat;
      }
    }

    return itemStatus;
  }

  check() {
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
      dom.append(this.container, itemStatus.thumbnail);
      dom.setData(
        itemStatus.thumbnail,
        "orig-src",
        itemStatus.item.getThumbnailUrl()
      );
      itemStatus.thumbnail.addEventListener("load", this.loadCompleteHandler);
      itemStatus.thumbnail.addEventListener("error", this.loadErrorHandler);
      itemStatus.thumbnail.src = itemStatus.item.getThumbnailUrl();
      log.debug(
        `load listening (${
          this.activeLoadCount
        }) ${itemStatus.item.getThumbnailUrl()}`
      );
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
    for (var f of this.itemStatus) {
      if (f.thumbnail == img) {
        f.loading = false;
        f.loaded = true;
        f.error = false;
      }
    }
    var src = dom.getData(img, "orig-src");
    var elements = dom.find(`[data-src$="${src}"]`);
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
    var datasrc = dom.getData(img, "src");
    if (datasrc == null) {
      return;
    }
    if (error) {
      dom.addClass(dom.getParent(img), "error");
    }
    var itemStatus = this.itemStatus.find((status) => {
      return status.item.getThumbnailUrl() == datasrc;
    });
    if (
      itemStatus != null &&
      itemStatus.thumbnail != null &&
      itemStatus.thumbnail.complete
    ) {
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
