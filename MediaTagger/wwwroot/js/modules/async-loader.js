import { ComponentLoader } from "../../drjs/browser/component-loader.js";
import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import dom from "../../drjs/browser/dom.js";

const log = Logger.create("AsyncLoader", LOG_LEVEL.INFO);

const DEFAULT_PRIORITY = 5;

class ItemPriority {
  // set a priority for each file to be loaded.
  // usually 0(low)-10(high) but can be outside range.
  constructor(item, priority = DEFAULT_PRIORITY) {
    this.file = item;
    this.priority = priority;
    this.image = null;
    this.thumbnail = null;
    this.loading = false;
  }

  getPriority() {
    return this.priority;
  }

  setPriority(p) {
    this.priority = p;
  }
}

class AsyncLoader {
  constructor() {
    this.concurrentLoadLimit = 1;
    this.activeLoadCount = 0;
    this.loadCompleteHandler = this.loadComplete.bind(this);
    this.loadErrorHandler = this.loadError.bind(this);
    this.itemPriority = [];
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
  }

  addFiles(files) {
    for (var file of files) {
      var priority = this.getItemPriority(file);
      if (priority == null) {
        this.itemPriority.push(new ItemPriority(file, DEFAULT_PRIORITY));
      }
    }
    this.check();
  }

  setPriority(file, priority) {
    var itemPriority = this.getItemPriority(file);
    if (itemPriority == null) {
      this.itemPriority.push(new ItemPriority(file, DEFAULT_PRIORITY));
    } else {
      itemPriority.setPriority(priority);
    }
    this.check();
  }
  increasePriority(file) {
    var itemPriority = this.getItemPriority(file);
    if (itemPriority == null) {
      this.itemPriority.push(new ItemPriority(file, DEFAULT_PRIORITY + 1));
    } else {
      itemPriority.setPriority(itemPriority.getPriority() + 1);
    }
    this.check();
  }

  clearPriorities() {
    this.itemPriority.forEach((ip) => {
      ip.priority = DEFAULT_PRIORITY;
    });
  }
  clearPriority(file) {
    var ItemPriority = this.getItemPriority(file);
    if (ItemPriority == null) {
      this.itemPriority.push(new ItemPriority(file, DEFAULT_PRIORITY));
    } else {
      ItemPriority.setPriority(DEFAULT_PRIORITY);
    }
    this.check();
  }

  getItemPriority(file) {
    return this.itemPriority.find((f) => {
      return f.file.getId() == file.getId();
    });
  }

  setConcurrentLoadLimit(limit) {
    this.concurrentLoadLimit = limit;
  }

  getNextFile() {
    var file = null;
    var priority = 0;
    this.itemPriority.forEach((fp) => {
      if (
        (file == null || fp.priority > priority) &&
        fp.thumbnail == null &&
        !fp.loading
      ) {
        priority = fp.priority;
        file = fp;
      }
    });
    return file;
  }

  check() {
    var itemPriority = this.getNextFile();
    while (
      itemPriority != null &&
      this.activeLoadCount < this.concurrentLoadLimit
    ) {
      log.debug(
        `load (${this.activeLoadCount}) ${itemPriority.file.getThumbnailUrl()}`
      );
      this.activeLoadCount += 1;
      itemPriority.loading = true;
      itemPriority.thumbnail = new Image();
      itemPriority.thumbnail.addEventListener("load", this.loadCompleteHandler);
      itemPriority.thumbnail.addEventListener("error", this.loadErrorHandler);
      itemPriority.thumbnail.src = itemPriority.file.getThumbnailUrl();
      dom.append(this.container, itemPriority.thumbnail);
      dom.setData(
        itemPriority.thumbnail,
        "orig-src",
        itemPriority.file.getThumbnailUrl()
      );
      if (itemPriority.thumbnail.complete) {
        this.finishLoading(itemPriority.thumbnail);
        this.activeLoadCount -= 1;
        log.debug(
          `load complete (${
            this.activeLoadCount
          }) ${itemPriority.file.getThumbnailUrl()}`
        );
        scheduleCheck();
      } else {
        itemPriority.thumbnail.addEventListener(
          "load",
          this.loadCompleteHandler
        );
        itemPriority.thumbnail.addEventListener("error", this.loadErrorHandler);
        log.debug(
          `load listening (${
            this.activeLoadCount
          }) ${itemPriority.file.getThumbnailUrl()}`
        );
      }

      itemPriority = this.getNextFile();
    }
  }

  loadComplete(event) {
    var img = event.target;
    log.debug(
      `load complete (${this.activeLoadCount}) ${img ? img.src : "no src"}`
    );
    this.itemPriority.forEach((f) => {
      if (f.thumbnail == img) {
        f.loading = false;
      }
    });
    this.activeLoadCount -= 1;
    this.finishLoading(event.target);
    log.debug(
      `load finished (${this.activeLoadCount}) ${img ? img.src : "no src"}`
    );
    this.scheduleCheck();
  }

  finishLoading(img) {
    var src = dom.getData(img, "orig-src");
    var elements = dom.find(`[data-src$="${src}"]`);
    elements.forEach((e) => {
      this.updateDOMImage(e);
    });
  }

  loadError(event) {
    var img = event.target;
    log.debug(
      `load error (${this.activeLoadCount}) ${img ? img.src : "no src"}`
    );
    this.itemPriority.forEach((f) => {
      if (f.thumbnail == img) {
        f.loading = false;
      }
    });
    log.error("failed to load thumbnail ", event.target.src);
    itemPriority.loading = false;
    this.activeLoadCount -= 1;
    log.debug(
      `load error finished (${this.activeLoadCount}) ${
        img ? img.src : "no src"
      }`
    );

    this.scheduleCheck();
  }

  updateDOMImage(img) {
    var isUnloaded = dom.getData(img, "unloaded");
    var datasrc = dom.getData(img, "src");
    if (isUnloaded == "true" && datasrc != null) {
      var itemPriority = this.itemPriority.find((ip) => {
        return ip.file.getThumbnailUrl() == datasrc;
      });
      if (
        itemPriority != null &&
        itemPriority.thumbnail != null &&
        itemPriority.thumbnail.complete
      ) {
        img.src = itemPriority.thumbnail.src;

        dom.addClass(dom.getParent(img), "loaded");
      }
    }
  }

  scheduleCheck() {
    setTimeout(() => {
      this.check();
    }, 1);
  }
}

var asyncLoader = new AsyncLoader();

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node instanceof HTMLElement) {
        var images = dom.find(node, "img");
        images.forEach((image) => {
          asyncLoader.updateDOMImage(image);
        });
        log.debug(`found ${images.length} images`);
      }
    });
  });
  asyncLoader.check();
});
observer.observe(document.body, { subtree: true, childList: true });

export default asyncLoader;
