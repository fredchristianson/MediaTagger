import { LOG_LEVEL, Logger } from '../../drjs/logger.js';
import { default as dom } from '../../drjs/browser/dom.js';

const log = Logger.create('ImageLoader', LOG_LEVEL.INFO);

const targetNode = document.body;

const config = { attributes: false, childList: true, subtree: true };

function imageLoaded(event) {
  log.debug('loaded');
  dom.removeClass(dom.getParent(event.target), 'unloaded');
}

function imageError(event) {
  dom.removeClass(dom.getParent(event.target), 'unloaded');
  dom.addClass(dom.getParent(event.target), 'error');
  log.debug('error');
}

function checkNode(node) {
  if (dom.hasClass(node, 'unloaded')) {
    const image = dom.first(node, 'img');
    if (image.complete) {
      dom.removeClass(node, 'unloaded');
    } else {
      image.addEventListener('load', imageLoaded);
      image.addEventListener('error', imageError);
    }
  }
}

const callback = (mutationList, observer) => {
  for (const mutation of mutationList) {
    const nodes = mutation.addedNodes;
    if (nodes != null && nodes.length > 0) {
    }
    for (const node of nodes) {
      checkNode(node);
    }
  }
};

export class ImageLoader {
  static async reload(imgElement, url) {
    //imgElement.setAttribute('src', '/image/error.png');
    const response = await fetch(url, {
      cache: 'reload',
      mode: 'no-cors'
    });
    if (response.ok) {
      const blob = await response.blob();
      imgElement.setAttribute('src', URL.createObjectURL(blob));
    } else {
      imgElement.setAttribute('src', '/image/error.png');
    }
  }
  constructor(parent) {
    this.observer = new MutationObserver(callback);
    this.observer.observe(dom.first(parent), config);
  }

  stop() {
    this.observer.disconnect();
  }
}

export default ImageLoader;
