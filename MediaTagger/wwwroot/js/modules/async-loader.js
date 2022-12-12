import { ComponentLoader } from "../../drjs/browser/component-loader.js";
import { LOG_LEVEL, Logger } from "../../drjs/logger.js";
import dom from "../../drjs/browser/dom.js";

const log = Logger.create("AsyncLoader", LOG_LEVEL.INFO);

class AsyncLoader {
  constructor() {
    this.concurrentLoadLimit = 1;
    this.activeLoadCount = 0;
    this.loadCompleteHandler = this.loadComplete.bind(this);
    this.loadErrorHandler = this.loadError.bind(this);
  }

  setConcurrentLoadLimit(limit) {
    this.concurrentLoadLimit = limit;
  }

  check() {
    var done = false;
    while (!done && this.activeLoadCount < this.concurrentLoadLimit) {
      var img = dom.first('img.in-view[data-unloaded="true"]');
      if (img == null) {
        img = dom.first('img[data-unloaded="true"]');
      }
      if (img != null) {
        this.activeLoadCount += 1;
        var smallUrl = dom.getData(img, "data-src-small");
        if (smallUrl && smallUrl != img.src) {
          img.src = smallUrl;
          dom.setData(img, "data-unloaded", false);

          if (img.loadComplete) {
            this.activeLoadCount -= 1;
            scheduleCheck();
          } else {
            img.addEventListener("load", this.loadCompleteHandler);
            img.addEventListener("error", this.loadErrorHandler);
          }
        }
      } else {
        done = true;
      }
    }
  }

  loadComplete(event) {
    this.activeLoadCount -= 1;
    this.scheduleCheck();
  }

  loadError(event) {
    this.activeLoadCount -= 1;
    this.scheduleCheck();
  }
  scheduleCheck() {
    setTimeout(() => {
      this.check();
    }, 1);
  }
}

function intersectionChange(entries, observer) {
  log.debug("intersection change");
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      dom.addClass(entry.target, "in-view");
    } else {
      dom.removeClass(entry.target, "in-view");
    }
  });
}

let options = {
  root: null,
  rootMargin: "0px",
  threshold: 1.0,
};

let intersectionObserver = new IntersectionObserver(
  intersectionChange,
  options
);

var asyncLoader = new AsyncLoader();
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node instanceof HTMLElement) {
        var images = dom.find(node, "img");
        images.forEach((image) => {
          intersectionObserver.observe(image);
        });
        log.debug(`found ${images.length} images`);
      }
    });
  });
  asyncLoader.check();
});
observer.observe(document.body, { subtree: true, childList: true });
export default asyncLoader;
